import BaseService from "./base";
import {ConsumeLogType, RegressionTaskType} from "@fm/common/constants";
import moment = require("moment");
import RegressionSignPrize from "../database/models/RegressionSignPrize";
import RegressionSignPrizeRecord from "../database/models/RegressionSignPrizeRecord";
import {service} from "./importService";
import RegressionRechargeRecord from "../database/models/RegressionRechargeRecord";
import RegressionTask from "../database/models/regressionTask";
import RoomRecord from "../database/models/roomRecord";
import StartPocketRecord from "../database/models/startPocketRecord";
import TurntablePrizeRecord from "../database/models/turntablePrizeRecord";
import RegressionTaskRecord from "../database/models/regressionTaskRecord";
import RegressionTaskTotalPrize from "../database/models/regressionTaskTotalPrize";
import RegressionTaskTotalPrizeRecord from "../database/models/regressionTaskTotalPrizeRecord";
// 玩家信息
export default class RegressionService extends BaseService {
  async onceReceive(player, day, isPay) {
    // 获取奖励配置
    const prizeInfo = await RegressionSignPrize.findOne({day});
    if (!prizeInfo) {
      return false;
    }

    let freePrizeList = [];
    let payPrizeList = [];

    // 判断是否领取
    let receiveInfo = await RegressionSignPrizeRecord.findOne({playerId: player._id, day: prizeInfo.day});
    if (receiveInfo && receiveInfo.freeReceive && receiveInfo.payReceive) {
      return false;
    }

    // 领取免费奖品
    if (!receiveInfo || (receiveInfo && !receiveInfo.freeReceive)) {
      if (receiveInfo) {
        receiveInfo.freeReceive = true;
      }

      freePrizeList = [...freePrizeList, ...prizeInfo.freePrizeList];

      for (let i = 0; i < prizeInfo.freePrizeList.length; i++) {
        await service.playerService.receivePrize(prizeInfo.freePrizeList[i], player._id, 1, ConsumeLogType.payRegressionSignGift);
      }
    }

    // 领取付费奖品
    if (!receiveInfo || (receiveInfo && !receiveInfo.payReceive) && isPay) {
      if (receiveInfo) {
        receiveInfo.payReceive = true;
      }

      payPrizeList = [...payPrizeList, ...prizeInfo.payPrizeList];

      for (let i = 0; i < prizeInfo.payPrizeList.length; i++) {
        await service.playerService.receivePrize(prizeInfo.payPrizeList[i], player._id, 1, ConsumeLogType.payRegressionSignGift);
      }
    }

    if (receiveInfo) {
      await receiveInfo.save();
    } else {
      // 创建领取记录
      const data = {
        playerId: player._id,
        prizeId: prizeInfo._id,
        day: prizeInfo.day,
        freeReceive: true,
        payReceive: true,
        prizeConfig: prizeInfo
      };

      await RegressionSignPrizeRecord.create(data);
    }

    return {payPrizeList, freePrizeList};
  }

  async getRegressionSignLists(user) {
    const prizeList = await RegressionSignPrize.find().sort({day: 1}).lean();
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await RegressionSignPrizeRecord.count({
      playerId: user._id,
      createAt: {$gte: start, $lt: end}
    });

    const startTime = user.regressionTime || new Date();

    const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);
    let days = await RegressionSignPrizeRecord.count({playerId: user._id});
    if (!isTodaySign) {
      days++;
    }

    // 判断是否已经购买
    const isPay = await RegressionRechargeRecord.findOne({
      playerId: user._id,
      status: 1,
      createAt: {$gte: startTime, $lt: endTime}
    });

    for (let i = 0; i < prizeList.length; i++) {
      const receiveInfo = await RegressionSignPrizeRecord.findOne({playerId: user._id, day: prizeList[i].day});
      prizeList[i].freeReceive = receiveInfo && receiveInfo.freeReceive;
      prizeList[i].payReceive = receiveInfo && receiveInfo.payReceive;
    }

    return {isPay: !!isPay, isTodaySign: !!isTodaySign, days, prizeList, activityTimes: {startTime, endTime}};
  }

  async getDailyTaskData(message, user) {
    const taskLists = await this.getDailyTaskDataByType(user);
    const sortTasks = this.sortTasks(taskLists);
    const canReceive = this.checkDailyTaskReceive(taskLists);

    // 计算活跃度
    const liveness = await RegressionTaskRecord.aggregate([
      { $match: { playerId: user._id.toString() } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await RegressionTaskTotalPrize.find();
    const totalLists = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await RegressionTaskTotalPrizeRecord.count({playerId: user._id, prizeId: totalPrizeList[i]._id});
      const data = {
        type: totalPrizeList[i].type,
        taskPrizes: totalPrizeList[i].taskPrizes,
        liveness: totalPrizeList[i].liveness,
        prizeId: totalPrizeList[i]._id.toString(),
        receive: !!isReceive
      };

      totalLists.push(data);
    }

    return {canReceive, taskLists: sortTasks, totalLists, liveness: livenessCount};
  }

  async getDailyTaskDataByType(user) {
    let taskLists = [];

    // 完成对局
    const joinGame = await this.getAchievementTask(user, RegressionTaskType.joinGame);
    if (joinGame.length) taskLists.push(...joinGame);

    // 开运好礼
    const beginLucky = await this.getAchievementTask(user, RegressionTaskType.beginLucky);
    if (beginLucky.length) taskLists.push(...beginLucky);

    // 幸运抽奖
    const turntable = await this.getAchievementTask(user, RegressionTaskType.turnrable);
    if (turntable.length) taskLists.push(...turntable);

    // 观看广告
    const watchAdver = await this.getAchievementTask(user, RegressionTaskType.watchAdver);
    if (watchAdver.length) taskLists.push(...watchAdver);

    return taskLists;
  }

  sortTasks(tasks) {
    const sortTasks = [];

    for (const task of tasks) {
      if (task.finish && !task.receive) {
        sortTasks.push(task);
      }
    }

    for (const task of tasks) {
      if (!task.finish) {
        sortTasks.push(task);
      }
    }

    for (const task of tasks) {
      if (task.finish && task.receive) {
        sortTasks.push(task);
      }
    }

    return sortTasks;
  }

  checkDailyTaskReceive(tasks) {
    let canReceive = false;

    for (const task of tasks) {
      if (task.finish && !task.receive) {
        canReceive = true;
        break;
      }
    }

    return canReceive;
  }

  async getAchievementTask(user, typeId) {
    let task = [];
    const tasks = await RegressionTask.find({typeId}).lean();

    for (let i = 0; i < tasks.length; i++) {
      const taskInfo = await this.checkTaskFinishAndReceive(tasks[i], user);
      if (!taskInfo.finish || (taskInfo.finish && !taskInfo.receive)) {
        task.push(taskInfo);
      }
    }

    return task;
  }

  async checkTaskFinishAndReceive(task, user) {
    // 完成对局
    if (task.typeId === RegressionTaskType.joinGame) {
      const start = moment(new Date()).startOf('day').toDate()
      const end = moment(new Date()).endOf('day').toDate()
      const juCount = await RoomRecord.count({
        creatorId: user.shortId,
        createAt: {$gte: start, $lt: end}
      });
      task.finish = juCount >= task.taskTimes;
      task.finishCount = juCount >= task.taskTimes ? task.taskTimes : juCount;
    }

    // 开运好礼
    if (task.typeId === RegressionTaskType.beginLucky) {
      const start = moment(new Date()).startOf('day').toDate()
      const end = moment(new Date()).endOf('day').toDate()
      const joinCount = await StartPocketRecord.count({
        playerId: user._id,
        createAt: {$gte: start, $lt: end}
      });
      task.finish = joinCount >= task.taskTimes;
      task.finishCount = joinCount >= task.taskTimes ? task.taskTimes : joinCount;
    }

    // 幸运抽奖
    if (task.typeId === RegressionTaskType.turnrable) {
      const start = moment(new Date()).startOf('day').toDate()
      const end = moment(new Date()).endOf('day').toDate()
      const joinCount = await TurntablePrizeRecord.count({
        playerId: user._id,
        createAt: {$gte: start, $lt: end}
      });
      task.finish = joinCount >= task.taskTimes;
      task.finishCount = joinCount >= task.taskTimes ? task.taskTimes : joinCount;
    }

    // 天道酬勤
    if (task.typeId === RegressionTaskType.watchAdver) {
      const joinCount = await RegressionTaskRecord.count({playerId: user._id.toString(), taskId: task.taskId});
      task.finish = joinCount >= task.taskTimes;
      task.finishCount = joinCount >= task.taskTimes ? task.taskTimes : joinCount;
    }


    const isReceive = await RegressionTaskRecord.count({playerId: user._id.toString(), taskId: task.taskId});
    task.receive = !!isReceive;

    return task;
  }
}
