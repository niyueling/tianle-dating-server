import {addApi, BaseApi} from "./baseApi";
import Player from "../../database/models/Player";
import {ConsumeLogType, TaskCategory, TaskType, TianleErrorCode} from "@fm/common/constants";
import TaskRecord from "../../database/models/TaskRecord";
import TaskTotalPrize from "../../database/models/TaskTotalPrize";
import TaskTotalPrizeRecord from "../../database/models/TaskTotalPrizeRecord";
import Task from "../../database/models/task";
import RoomScoreRecord from "../../database/models/roomScoreRecord";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import PlayerCardTable from "../../database/models/PlayerCardTable";
import PlayerMedal from "../../database/models/PlayerMedal";
import DiamondRecord from "../../database/models/diamondRecord";
import {service} from "../../service/importService";
import moment = require("moment");

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

    if (!message.multiple) {
      message.multiple = 1;
    }

    const result = await this.finishDailyTaskOnce(message, user);
    return this.replySuccess(result);
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
    const tasks = [];

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
      if (task.finish) {
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
      const playerCardTableCount = await PlayerCardTable.count({playerId: user._id, times: -1});
      task.finish = playerCardTableCount >= task.taskTimes;
      task.finishCount = playerCardTableCount >= task.taskTimes ? task.taskTimes : playerCardTableCount;
    }

    // 颜值担当
    if (task.typeId === TaskType.developAppearanceLevelPlay) {
      const playerHeadBorderCount = await PlayerHeadBorder.count({playerId: user._id, times: -1});
      task.finish = playerHeadBorderCount >= task.taskTimes;
      task.finishCount = playerHeadBorderCount >= task.taskTimes ? task.taskTimes : playerHeadBorderCount;
    }

    // 颜值担当
    if (task.typeId === TaskType.developAppearanceLevelPlay) {
      const playerHeadBorderCount = await PlayerHeadBorder.count({playerId: user._id, times: -1});
      task.finish = playerHeadBorderCount >= task.taskTimes;
      task.finishCount = playerHeadBorderCount >= task.taskTimes ? task.taskTimes : playerHeadBorderCount;
    }

    // 弄潮儿
    if (task.typeId === TaskType.developTide) {
      const playerMedalCount = await PlayerMedal.count({playerId: user._id, times: -1});
      task.finish = playerMedalCount >= task.taskTimes;
      task.finishCount = playerMedalCount >= task.taskTimes ? task.taskTimes : playerMedalCount;
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
    task.taskDescribe = task.taskDescribe.replace("?", task.finishCount);

    return task;
  }

  async finishDailyTaskOnce(message, user) {
    // 获取任务配置
    const taskInfo = await Task.findOne({taskId: message.taskId}).lean();
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
    await service.playerService.receivePrize(taskInfo.taskPrizes, this.player._id, message.multiple, ConsumeLogType.receiveTask);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      taskId: taskInfo.taskId,
      liveness: taskInfo.liveness,
      taskConfig: taskInfo,
      createAt: new Date()
    };

    return await TaskRecord.create(data);
  }
}
