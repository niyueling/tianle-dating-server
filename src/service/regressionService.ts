import BaseService from "./base";
import TaskRecord from "../database/models/TaskRecord";
import TaskTotalPrize from "../database/models/TaskTotalPrize";
import TaskTotalPrizeRecord from "../database/models/TaskTotalPrizeRecord";
import {ConsumeLogType, TaskCategory, TaskType} from "@fm/common/constants";
import Task from "../database/models/task";
import RoomScoreRecord from "../database/models/roomScoreRecord";
import PlayerCardTable from "../database/models/PlayerCardTable";
import PlayerHeadBorder from "../database/models/PlayerHeadBorder";
import PlayerMedal from "../database/models/PlayerMedal";
import DiamondRecord from "../database/models/diamondRecord";
import moment = require("moment");
import RegressionSignPrize from "../database/models/RegressionSignPrize";
import RegressionSignPrizeRecord from "../database/models/RegressionSignPrizeRecord";
import {service} from "./importService";
import RegressionRechargeRecord from "../database/models/RegressionRechargeRecord";
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
    const taskLists = await this.getDailyTaskDataByType(message, user);
    const sortTasks = this.sortTasks(taskLists);
    const canReceive = this.checkDailyTaskReceive(taskLists);

    // 计算活跃度
    const liveness = await TaskRecord.aggregate([
      { $match: { playerId: user._id.toString() } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await TaskTotalPrize.find();
    const totalLists = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await TaskTotalPrizeRecord.count({playerId: user._id.toString(), prizeId: totalPrizeList[i]._id});
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

    // 成长成就
    if(message.taskType === TaskCategory.develop) {
      // 富可敌国
      const developGetDiamond = await this.getAchievementTask(user, TaskType.developGetDiamond);
      if (developGetDiamond && developGetDiamond.taskId) taskLists.push(developGetDiamond);

      // 宴会大亨
      const developSignDay = await this.getAchievementTask(user, TaskType.developSignDay);
      if (developSignDay && developSignDay.taskId) taskLists.push(developSignDay);

      // 久经沙场
      const developTotalJuCount = await this.getAchievementTask(user, TaskType.developTotalJuCount);
      if (developTotalJuCount && developTotalJuCount.taskId) taskLists.push(developTotalJuCount);

      // 天道酬勤
      const developSimpleJuCount = await this.getAchievementTask(user, TaskType.developSimpleJuCount);
      if (developSimpleJuCount && developSimpleJuCount.taskId) taskLists.push(developSimpleJuCount);

      // 人生赢家
      const developGetGold = await this.getAchievementTask(user, TaskType.developGetGold);
      if (developGetGold && developGetGold.taskId) taskLists.push(developGetGold);

      // 收藏家
      const developCollect = await this.getAchievementTask(user, TaskType.developCollect);
      if (developCollect && developCollect.taskId) taskLists.push(developCollect);

      // 颜值担当
      const developAppearanceLevelPlay = await this.getAchievementTask(user, TaskType.developAppearanceLevelPlay);
      if (developAppearanceLevelPlay && developAppearanceLevelPlay.taskId) taskLists.push(developAppearanceLevelPlay);

      // 贵族气质
      const developNobility = await this.getAchievementTask(user, TaskType.developNobility);
      if (developNobility && developNobility.taskId) taskLists.push(developNobility);

      // 弄潮儿
      const developTide = await this.getAchievementTask(user, TaskType.developTide);
      if (developTide && developTide.taskId) taskLists.push(developTide);
    }

    // 对局成就
    if(message.taskType === TaskCategory.game) {
      // 高处不胜寒
      const gameLonelyAtTheTop = await this.getAchievementTask(user, TaskType.gameLonelyAtTheTop);
      if (gameLonelyAtTheTop && gameLonelyAtTheTop.taskId) taskLists.push(gameLonelyAtTheTop);

      // 嘎嘎乱杀
      const gameQuackStrike = await this.getAchievementTask(user, TaskType.gameQuackStrike);
      if (gameQuackStrike && gameQuackStrike.taskId) taskLists.push(gameQuackStrike);

      // 禁止划水
      const gameNoStroke = await this.getAchievementTask(user, TaskType.gameNoStroke);
      if (gameNoStroke && gameNoStroke.taskId) taskLists.push(gameNoStroke);

      // 快枪手
      const gameTheMarksman = await this.getAchievementTask(user, TaskType.gameTheMarksman);
      if (gameTheMarksman && gameTheMarksman.taskId) taskLists.push(gameTheMarksman);

      // 疯狂屠夫
      const gameMadButcher = await this.getAchievementTask(user, TaskType.gameMadButcher);
      if (gameMadButcher && gameMadButcher.taskId) taskLists.push(gameMadButcher);

      // 回村的诱惑
      const gameGoVillage = await this.getAchievementTask(user, TaskType.gameGoVillage);
      if (gameGoVillage && gameGoVillage.taskId) taskLists.push(gameGoVillage);

      // 决胜千里
      const gameDecisiveVictory = await this.getAchievementTask(user, TaskType.gameDecisiveVictory);
      if (gameDecisiveVictory && gameDecisiveVictory.taskId) taskLists.push(gameDecisiveVictory);

      // 赛诸葛
      const gameSeszge = await this.getAchievementTask(user, TaskType.gameSeszge);
      if (gameSeszge && gameSeszge.taskId) taskLists.push(gameSeszge);

      // 散财童子
      const gameLooseMoneyBoy = await this.getAchievementTask(user, TaskType.gameLooseMoneyBoy);
      if (gameLooseMoneyBoy && gameLooseMoneyBoy.taskId) taskLists.push(gameLooseMoneyBoy);

      // 收割机器
      const gameReapingMachine = await this.getAchievementTask(user, TaskType.gameReapingMachine);
      if (gameReapingMachine && gameReapingMachine.taskId) taskLists.push(gameReapingMachine);
    }

    // 玩法成就
    if(message.taskType === TaskCategory.gamePlay) {
      // 天选之人
      const gamePlayChosenOne = await this.getAchievementTask(user, TaskType.gamePlayChosenOne);
      if (gamePlayChosenOne && gamePlayChosenOne.taskId) taskLists.push(gamePlayChosenOne);

      // 潘达守护者
      const gamePlayPandan = await this.getAchievementTask(user, TaskType.gamePlayPandan);
      if (gamePlayPandan && gamePlayPandan.taskId) taskLists.push(gamePlayPandan);

      // 落地成盒
      const gamePlayBoxToBox = await this.getAchievementTask(user, TaskType.gamePlayBoxToBox);
      if (gamePlayBoxToBox && gamePlayBoxToBox.taskId) taskLists.push(gamePlayBoxToBox);

      // 春风得意
      const gamePlayTriumphant = await this.getAchievementTask(user, TaskType.gamePlayTriumphant);
      if (gamePlayTriumphant && gamePlayTriumphant.taskId) taskLists.push(gamePlayTriumphant);

      // 幸运之星
      const gamePlayLuckyStar = await this.getAchievementTask(user, TaskType.gamePlayLuckyStar);
      if (gamePlayLuckyStar && gamePlayLuckyStar.taskId) taskLists.push(gamePlayLuckyStar);

      // 人生如梦
      const gamePlayLifeIsDream = await this.getAchievementTask(user, TaskType.gamePlayLifeIsDream);
      if (gamePlayLifeIsDream && gamePlayLifeIsDream.taskId) taskLists.push(gamePlayLifeIsDream);
    }

    // 玩法成就
    if(message.taskType === TaskCategory.special) {
      // 财富达人
      const specialFortuneMaster = await this.getAchievementTask(user, TaskType.specialFortuneMaster);
      if (specialFortuneMaster && specialFortuneMaster.taskId) taskLists.push(specialFortuneMaster);

      // 贵族专业户
      const specialAristocraticSpecialized = await this.getAchievementTask(user, TaskType.specialAristocraticSpecialized);
      if (specialAristocraticSpecialized && specialAristocraticSpecialized.taskId) taskLists.push(specialAristocraticSpecialized);

      // 豪气冲天
      const specialLoftyHeroic = await this.getAchievementTask(user, TaskType.specialLoftyHeroic);
      if (specialLoftyHeroic && specialLoftyHeroic.taskId) taskLists.push(specialLoftyHeroic);

      // 左右逢源
      const specialTurnTables = await this.getAchievementTask(user, TaskType.specialTurnTables);
      if (specialTurnTables && specialTurnTables.taskId) taskLists.push(specialTurnTables);
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

  async getAchievementTask(user, typeId) {
    let task = null;
    const tasks = await Task.find({typeId}).lean();

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
    // 富可敌国
    if (task.typeId === TaskType.developGetDiamond) {
      task.finish = user.diamond >= task.taskTimes;
      task.finishCount = user.diamond >= task.taskTimes ? task.taskTimes : user.diamond;
    }

    // 宴会大亨
    if (task.typeId === TaskType.developSignDay) {
      task.finish = user.totalSignLoginDays >= task.taskTimes;
      task.finishCount = user.totalSignLoginDays >= task.taskTimes ? task.taskTimes : user.totalSignLoginDays;
    }

    // 久经沙场
    if (task.typeId === TaskType.developTotalJuCount) {
      const juCount = await RoomScoreRecord.count({
        creatorId: user.shortId
      });
      task.finish = juCount >= task.taskTimes;
      task.finishCount = juCount >= task.taskTimes ? task.taskTimes : juCount;
    }

    // 天道酬勤
    if (task.typeId === TaskType.developSimpleJuCount) {
      const start = moment(new Date()).startOf('day').toDate()
      const end = moment(new Date()).endOf('day').toDate()
      const juCount = await RoomScoreRecord.count({
        creatorId: user.shortId,
        createAt: {$gte: start, $lt: end}
      });
      task.finish = juCount >= task.taskTimes;
      task.finishCount = juCount >= task.taskTimes ? task.taskTimes : juCount;
    }

    // 人生赢家
    if (task.typeId === TaskType.developGetGold) {
      task.finish = user.gold >= task.taskTimes;
      task.finishCount = user.gold >= task.taskTimes ? task.taskTimes : user.gold;
    }

    // 收藏家
    if (task.typeId === TaskType.developCollect) {
      const playerCardTableCount = await PlayerCardTable.count({playerId: user._id, times: -1, propId: {$ne: 1200}});
      task.finish = playerCardTableCount >= task.taskTimes;
      task.finishCount = playerCardTableCount >= task.taskTimes ? task.taskTimes : playerCardTableCount;
    }

    // 颜值担当
    if (task.typeId === TaskType.developAppearanceLevelPlay) {
      const playerHeadBorderCount = await PlayerHeadBorder.count({playerId: user._id, times: -1, propId: {$ne: 1000}});
      task.finish = playerHeadBorderCount >= task.taskTimes;
      task.finishCount = playerHeadBorderCount >= task.taskTimes ? task.taskTimes : playerHeadBorderCount;
    }

    // 贵族气质
    if (task.typeId === TaskType.developNobility) {
      task.finish = user.vip >= task.taskTimes;
      task.finishCount = user.vip >= task.taskTimes ? task.taskTimes : user.vip;
    }

    // 弄潮儿
    if (task.typeId === TaskType.developTide) {
      const playerMedalCount = await PlayerMedal.count({playerId: user._id, times: -1});
      task.finish = playerMedalCount >= task.taskTimes;
      task.finishCount = playerMedalCount >= task.taskTimes ? task.taskTimes : playerMedalCount;
    }

    // 高处不胜寒
    if (task.typeId === TaskType.gameLonelyAtTheTop) {
      task.finish = user.atTheTopCount >= task.taskTimes;
      task.finishCount = user.atTheTopCount >= task.taskTimes ? task.taskTimes : user.atTheTopCount;
    }

    // 嘎嘎乱杀
    if (task.typeId === TaskType.gameQuackStrike) {
      task.finish = user.quackStrikeCount >= task.taskTimes;
      task.finishCount = user.quackStrikeCount >= task.taskTimes ? task.taskTimes : user.quackStrikeCount;
    }

    // 禁止划水
    if (task.typeId === TaskType.gameNoStroke) {
      task.finish = user.noStrokeCount >= task.taskTimes;
      task.finishCount = user.noStrokeCount >= task.taskTimes ? task.taskTimes : user.noStrokeCount;
    }

    // 快枪手
    if (task.typeId === TaskType.gameTheMarksman) {
      task.finish = user.theMarksmanCount >= task.taskTimes;
      task.finishCount = user.theMarksmanCount >= task.taskTimes ? task.taskTimes : user.theMarksmanCount;
    }

    // 疯狂屠夫
    if (task.typeId === TaskType.gameMadButcher) {
      task.finish = user.madButcherCount >= task.taskTimes;
      task.finishCount = user.madButcherCount >= task.taskTimes ? task.taskTimes : user.madButcherCount;
    }

    // 回村的诱惑
    if (task.typeId === TaskType.gameGoVillage) {
      task.finish = user.goVillageCount >= task.taskTimes;
      task.finishCount = user.goVillageCount >= task.taskTimes ? task.taskTimes : user.goVillageCount;
    }

    // 决胜千里
    if (task.typeId === TaskType.gameDecisiveVictory) {
      task.finish = user.juWinCount >= task.taskTimes;
      task.finishCount = user.juWinCount >= task.taskTimes ? task.taskTimes : user.juWinCount;
    }

    // 赛诸葛
    if (task.typeId === TaskType.gameSeszge) {
      task.finish = user.juContinueWinCount >= task.taskTimes;
      task.finishCount = user.juContinueWinCount >= task.taskTimes ? task.taskTimes : user.juContinueWinCount;
    }

    // 散财童子
    if (task.typeId === TaskType.gameLooseMoneyBoy) {
      task.finish = user.looseMoneyBoyAmount >= task.taskTimes;
      task.finishCount = user.looseMoneyBoyAmount >= task.taskTimes ? task.taskTimes : user.looseMoneyBoyAmount;
    }

    // 收割机器
    if (task.typeId === TaskType.gameReapingMachine) {
      task.finish = user.reapingMachineAmount >= task.taskTimes;
      task.finishCount = user.reapingMachineAmount >= task.taskTimes ? task.taskTimes : user.reapingMachineAmount;
    }

    // 天选之人
    if (task.typeId === TaskType.gamePlayChosenOne) {
      task.finish = user.chosenOneCount >= task.taskTimes;
      task.finishCount = user.chosenOneCount >= task.taskTimes ? task.taskTimes : user.chosenOneCount;
    }

    // 潘达守护者
    if (task.typeId === TaskType.gamePlayPandan) {
      task.finish = user.pandanCount >= task.taskTimes;
      task.finishCount = user.pandanCount >= task.taskTimes ? task.taskTimes : user.pandanCount;
    }

    // 落地成盒
    if (task.typeId === TaskType.gamePlayBoxToBox) {
      task.finish = user.boxToBoxCount >= task.taskTimes;
      task.finishCount = user.boxToBoxCount >= task.taskTimes ? task.taskTimes : user.boxToBoxCount;
    }

    // 春风得意
    if (task.typeId === TaskType.gamePlayTriumphant) {
      task.finish = user.triumphantCount >= task.taskTimes;
      task.finishCount = user.triumphantCount >= task.taskTimes ? task.taskTimes : user.triumphantCount;
    }

    // 幸运之星
    if (task.typeId === TaskType.gamePlayLuckyStar) {
      task.finish = user.luckyStarCount >= task.taskTimes;
      task.finishCount = user.luckyStarCount >= task.taskTimes ? task.taskTimes : user.luckyStarCount;
    }

    // 人生如梦
    if (task.typeId === TaskType.gamePlayLifeIsDream) {
      task.finish = user.lifeIsDreamCount >= task.taskTimes;
      task.finishCount = user.lifeIsDreamCount >= task.taskTimes ? task.taskTimes : user.lifeIsDreamCount;
    }

    // 财富达人
    if (task.typeId === TaskType.specialFortuneMaster) {
      const recordCount = await DiamondRecord.count({player: user._id, type: ConsumeLogType.gemForRuby});
      task.finish = recordCount >= task.taskTimes;
      task.finishCount = recordCount >= task.taskTimes ? task.taskTimes : recordCount;
    }

    // 贵族专业户
    if (task.typeId === TaskType.specialAristocraticSpecialized) {
      task.finish = user.payVipCount >= task.taskTimes;
      task.finishCount = user.payVipCount >= task.taskTimes ? task.taskTimes : user.payVipCount;
    }

    // 豪气冲天
    if (task.typeId === TaskType.specialLoftyHeroic) {
      task.finish = user.loftyHeroicCount >= task.taskTimes;
      task.finishCount = user.loftyHeroicCount >= task.taskTimes ? task.taskTimes : user.loftyHeroicCount;
    }

    // 左右逢源
    if (task.typeId === TaskType.specialTurnTables) {
      task.finish = user.shopFreeGiftCount >= task.taskTimes;
      task.finishCount = user.shopFreeGiftCount >= task.taskTimes ? task.taskTimes : user.shopFreeGiftCount;
    }

    const isReceive = await TaskRecord.count({playerId: user._id.toString(), taskId: task.taskId});
    task.receive = !!isReceive;

    // 任务描述用finishCount替换?
    // task.taskDescribe = task.taskDescribe.replace("?", task.finishCount);

    return task;
  }
}
