import {addApi, BaseApi} from "./baseApi";
import Player from "../../database/models/player";
import {ConsumeLogType, TaskCategory, debrisType, TianleErrorCode} from "@fm/common/constants";
import {service} from "../../service/importService";
import moment = require("moment");
import Debris from "../../database/models/debris";
import PlayerCardTypeRecord from "../../database/models/playerCardTypeRecord";
import DebrisRecord from "../../database/models/DebrisRecord";
import DebrisTotalPrize from "../../database/models/DebrisTotalPrize";
import DebrisTotalPrizeRecord from "../../database/models/DebrisTotalPrizeRecord";

export class TaskApi extends BaseApi {
  @addApi()
  async taskLists(message) {
    const user = await Player.findOne({_id: this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const taskData = await this.getDailyTaskData(message, user);

    return this.replySuccess(taskData);
  }

  @addApi()
  async finishTask(message) {
    const user = await Player.findOne({_id: this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const result = await this.finishDailyTaskOnce(message, user);
    await this.player.updateResource2Client();
    return this.replySuccess(result);
  }

  @addApi()
  async receiveTaskTotalActivity(message) {
    const user = await Player.findOne({_id:this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    // 计算活跃度
    const liveness = await PlayerCardTypeRecord.aggregate([
      { $match: { playerId: user._id } },
      { $group: { _id: null, sum: { $sum: "$count" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取奖励配置
    const prizeInfo = await DebrisTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    if (livenessCount < prizeInfo.liveness) {
      return this.replyFail(TianleErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await DebrisTotalPrizeRecord.findOne({playerId: user._id, prizeId: prizeInfo._id});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await service.playerService.receivePrize(prizeInfo, user._id, 1, ConsumeLogType.receiveTask);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    const record = await DebrisTotalPrizeRecord.create(data);
    await this.player.updateResource2Client();

    return this.replySuccess(record);
  }

  async getDailyTaskData(message, user) {
    const taskLists = await this.getDailyTaskDataByType(message, user);
    const sortTasks = this.sortTasks(taskLists);
    const canReceive = this.checkDailyTaskReceive(taskLists);

    // 计算活跃度
    const liveness = await PlayerCardTypeRecord.aggregate([
      { $match: { playerId: user._id } },
      { $group: { _id: null, sum: { $sum: "$count" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await DebrisTotalPrize.find();
    const totalLists = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await DebrisTotalPrizeRecord.count({playerId: user._id, prizeId: totalPrizeList[i]._id});
      const data = {
        id: totalPrizeList[i].propId,
        type: totalPrizeList[i].type,
        count: totalPrizeList[i].number,
        liveness: totalPrizeList[i].liveness,
        prizeId: totalPrizeList[i]._id.toString(),
        receive: !!isReceive
      };

      totalLists.push(data);
    }

    return {canReceive, taskLists: sortTasks, totalLists, liveness: livenessCount};
  }

  async getDailyTaskDataByType(message, user) {
    let taskLists = [];

    // 番型
    if(message.taskType === TaskCategory.develop) {
      // 星蝎交辉
      const xingHeJiaoHui = await this.getAchievementTask(user, debrisType.xingHeJiaoHui, TaskCategory.develop);
      if (xingHeJiaoHui && xingHeJiaoHui.taskId) taskLists.push(xingHeJiaoHui);

      // 摩羯之吻
      const moJieZhiWen = await this.getAchievementTask(user, debrisType.moJieZhiWen, TaskCategory.develop);
      if (moJieZhiWen && moJieZhiWen.taskId) taskLists.push(moJieZhiWen);

      // 众星捧月
      const zhongXingPengYue = await this.getAchievementTask(user, debrisType.zhongXingPengYue, TaskCategory.develop);
      if (zhongXingPengYue && zhongXingPengYue.taskId) taskLists.push(zhongXingPengYue);

      // 月落星沉
      const yueLuoXingChen = await this.getAchievementTask(user, debrisType.yueLuoXingChen, TaskCategory.develop);
      if (yueLuoXingChen && yueLuoXingChen.taskId) taskLists.push(yueLuoXingChen);

      // 大步流星
      const daBuLiuXing = await this.getAchievementTask(user, debrisType.daBuLiuXing, TaskCategory.develop);
      if (daBuLiuXing && daBuLiuXing.taskId) taskLists.push(daBuLiuXing);

      // 星流影集
      const xingLiuYingJi = await this.getAchievementTask(user, debrisType.xingLiuYingJi, TaskCategory.develop);
      if (xingLiuYingJi && xingLiuYingJi.taskId) taskLists.push(xingLiuYingJi);

      // 移星换斗
      const yiXingHuanDou = await this.getAchievementTask(user, debrisType.yiXingHuanDou, TaskCategory.develop);
      if (yiXingHuanDou && yiXingHuanDou.taskId) taskLists.push(yiXingHuanDou);

      // 一天星斗
      const yiTianXingDou = await this.getAchievementTask(user, debrisType.yiTianXingDou, TaskCategory.develop);
      if (yiTianXingDou && yiTianXingDou.taskId) taskLists.push(yiTianXingDou);

      // 棋布星陈
      const qiBuXingChen = await this.getAchievementTask(user, debrisType.qiBuXingChen, TaskCategory.develop);
      if (qiBuXingChen && qiBuXingChen.taskId) taskLists.push(qiBuXingChen);

      // 星离月会
      const xingLiYueHui = await this.getAchievementTask(user, debrisType.xingLiYueHui, TaskCategory.develop);
      if (xingLiYueHui && xingLiYueHui.taskId) taskLists.push(xingLiYueHui);

      // 流星望电
      const liuXingWangDian = await this.getAchievementTask(user, debrisType.liuXingWangDian, TaskCategory.develop);
      if (liuXingWangDian && liuXingWangDian.taskId) taskLists.push(liuXingWangDian);

      // 星流电击
      const xingLiuDianJi = await this.getAchievementTask(user, debrisType.xingLiuDianJi, TaskCategory.develop);
      if (xingLiuDianJi && xingLiuDianJi.taskId) taskLists.push(xingLiuDianJi);

      // 三星高照
      const sanXingGaoZhao = await this.getAchievementTask(user, debrisType.sanXingGaoZhao, TaskCategory.develop);
      if (sanXingGaoZhao && sanXingGaoZhao.taskId) taskLists.push(sanXingGaoZhao);

      // 一路福星
      const yiLuFuXing = await this.getAchievementTask(user, debrisType.yiLuFuXing, TaskCategory.develop);
      if (yiLuFuXing && qiBuXingChen.yiLuFuXing) taskLists.push(yiLuFuXing);

      // 十二星座
      const shiErXingZuo = await this.getAchievementTask(user, debrisType.shiErXingZuo, TaskCategory.develop);
      if (shiErXingZuo && shiErXingZuo.taskId) taskLists.push(shiErXingZuo);
    }

    // 星座杠
    if(message.taskType === TaskCategory.game) {
      // 白羊座
      const baiYang = await this.getAchievementTask(user, debrisType.baiYang, TaskCategory.game);
      if (baiYang && baiYang.taskId) taskLists.push(baiYang);

      // 金牛座
      const jinNiu = await this.getAchievementTask(user, debrisType.jinNiu, TaskCategory.game);
      if (jinNiu && jinNiu.taskId) taskLists.push(jinNiu);

      // 双子座
      const shuangZi = await this.getAchievementTask(user, debrisType.shuangZi, TaskCategory.game);
      if (shuangZi && shuangZi.taskId) taskLists.push(shuangZi);

      // 巨蟹座
      const juXie = await this.getAchievementTask(user, debrisType.juXie, TaskCategory.game);
      if (juXie && juXie.taskId) taskLists.push(juXie);

      // 狮子座
      const shiZi = await this.getAchievementTask(user, debrisType.shiZi, TaskCategory.game);
      if (shiZi && shiZi.taskId) taskLists.push(shiZi);

      // 处女座
      const chuNv = await this.getAchievementTask(user, debrisType.chuNv, TaskCategory.game);
      if (chuNv && chuNv.taskId) taskLists.push(chuNv);

      // 天秤座
      const tianPeng = await this.getAchievementTask(user, debrisType.tianPeng, TaskCategory.game);
      if (tianPeng && tianPeng.taskId) taskLists.push(tianPeng);

      // 天蝎座
      const tianQie = await this.getAchievementTask(user, debrisType.tianQie, TaskCategory.game);
      if (tianQie && tianQie.taskId) taskLists.push(tianQie);

      // 射手座
      const sheShou = await this.getAchievementTask(user, debrisType.sheShou, TaskCategory.game);
      if (sheShou && sheShou.taskId) taskLists.push(sheShou);

      // 摩羯座
      const moJie = await this.getAchievementTask(user, debrisType.moJie, TaskCategory.game);
      if (moJie && moJie.taskId) taskLists.push(moJie);

      // 水瓶座
      const shuiPing = await this.getAchievementTask(user, debrisType.shuiPing, TaskCategory.game);
      if (shuiPing && shuiPing.taskId) taskLists.push(shuiPing);

      // 双鱼座
      const shuangYu = await this.getAchievementTask(user, debrisType.shuangYu, TaskCategory.game);
      if (shuangYu && shuangYu.taskId) taskLists.push(shuangYu);
    }

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

  async getAchievementTask(user, typeId, taskType) {
    let task = null;
    const tasks = await Debris.find({typeId, taskType}).lean();

    for (let i = 0; i < tasks.length; i++) {
      const taskInfo = await this.checkTaskFinishAndReceive(tasks[i], user);
      if (!taskInfo.finish || (taskInfo.finish && !taskInfo.receive)) {
        task = taskInfo;
        break;
      }
    }

    return task;
  }

  async checkTaskFinishAndReceive(task, user) {
    const record = await PlayerCardTypeRecord.findOne({playerId: user._id, taskType: task.taskType, typeId: task.typeId});
    const finishCount = record ? record.count : 0;
    task.finish = finishCount >= task.taskTimes;
    task.finishCount = finishCount;

    const isReceive = await DebrisRecord.count({playerId: user._id.toString(), taskId: task.taskId});
    task.receive = !!isReceive;

    return task;
  }

  async finishDailyTaskOnce(message, user) {
    // 获取任务配置
    const taskInfo = await Debris.findOne({taskId: message.taskId}).lean();
    if (!taskInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 根据不同任务类型判断是否完成任务
    const taskResult = await this.checkTaskFinishAndReceive(taskInfo, user);

    if (!taskResult.finish) {
      return this.replyFail(TianleErrorCode.taskNotFinish);
    }

    if (taskResult.receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await service.playerService.receivePrize(taskInfo.taskPrizes, this.player._id, 1, ConsumeLogType.receiveTask);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      taskId: taskInfo.taskId,
      taskConfig: taskInfo,
      createAt: new Date()
    };

    return await DebrisRecord.create(data);
  }
}
