import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import {service} from "../../service/importService";
import Player from "../../database/models/player";
import NewSignPrizeRecord from "../../database/models/NewSignPrizeRecord";
import NewSignPrize from "../../database/models/NewSignPrize";
import HeadBorder from "../../database/models/HeadBorder";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import Medal from "../../database/models/Medal";
import PlayerMedal from "../../database/models/PlayerMedal";
import NewTask from "../../database/models/newTask";
import NewTaskRecord from "../../database/models/NewTaskRecord";
import DiamondRecord from "../../database/models/diamondRecord";
import UserRechargeOrder from "../../database/models/userRechargeOrder";
import NewFirstRecharge from "../../database/models/NewFirstRecharge";
import NewFirstRechargeRecord from "../../database/models/NewFirstRechargeRecord";
import CardTable from "../../database/models/CardTable";
import PlayerCardTable from "../../database/models/PlayerCardTable";
import RechargeParty from "../../database/models/RechargeParty";
import PlayerRechargePartyRecord from "../../database/models/PlayerRechargePartyRecord";

export class NewSignApi extends BaseApi {
  // 新人签到列表
  @addApi()
  async signLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getNewSignLists(user);

    return this.replySuccess(data);
  }

  // 领取新手签到奖励
  @addApi({
    rule: {
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async signIn(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await NewSignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await NewSignPrizeRecord.findOne({playerId: this.player._id, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await this.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple, ConsumeLogType.receiveNewSign);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await NewSignPrizeRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 新人指引列表
  @addApi()
  async guideLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getGuideLists(user);

    return this.replySuccess(data);
  }

  // 领取新手指引奖励
  @addApi({
    rule: {
      taskId: 'number',
      multiple: "number?"
    }
  })
  async finishGuide(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const taskInfo = await NewTask.findOne({taskId: message.taskId});
    if (!taskInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await NewTaskRecord.count({playerId: this.player._id, taskId: taskInfo.taskId});

    // if (receive) {
    //   return this.replyFail(TianleErrorCode.prizeIsReceive);
    // }

    // 按照奖励类型领取奖励
    for (let i = 0; i < taskInfo.taskPrizes.length; i++) {
      await this.receivePrize(taskInfo.taskPrizes[i], this.player._id, message.multiple, ConsumeLogType.receiveNewGuide);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      taskId: taskInfo.taskId,
      taskConfig: taskInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await NewTaskRecord.create(data);

    // 判断是否完成所有任务，是的话奖励88钻石
    const receiveCount = await NewTaskRecord.count({playerId: this.player._id});
    if (receiveCount === 5) {
      const model = await service.playerService.getPlayerModel(this.player._id);
      model.diamond += 88;
      await model.save();
      await service.playerService.logGemConsume(model._id, ConsumeLogType.receiveNewGuide, 88,
        model.diamond, `新手指引获得88钻石`);

      data.taskConfig.taskPrizes.push({type: 1, number: 88});
    }

    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 新人首充列表
  @addApi()
  async firstRechargeList() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getFirstRechargeList(user);

    return this.replySuccess(data);
  }

  // 领取新人首充奖励
  @addApi({
    rule: {
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async receiveFirstRecharge(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await NewFirstRecharge.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await NewFirstRechargeRecord.findOne({playerId: this.player._id, "prizeConfig.day": prizeInfo.day});

    // if (receive) {
    //   return this.replyFail(TianleErrorCode.prizeIsReceive);
    // }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await this.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple, ConsumeLogType.receiveNewSign);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await NewFirstRechargeRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 充值派对列表
  @addApi()
  async rechargePartyList() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data= await this.getRechargePartyList(user);

    return this.replySuccess(data);
  }

  // 获取充值派对奖励
  @addApi()
  async receiveRechargePartyPrize(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await RechargeParty.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const receive = await PlayerRechargePartyRecord.findOne({playerId: this.player._id, prizeId: prizeInfo._id, createAt: {$gte: start, $lt: end}});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await this.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple, ConsumeLogType.receiveRechargeParty);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: prizeInfo._id,
      price: prizeInfo.price,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await PlayerRechargePartyRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  async getGuideLists(user) {
    const taskList = await NewTask.find().lean();
    let tasks = [];

    for (let i = 0; i < taskList.length; i++) {
      const task = await this.checkTaskState(taskList[i]);
      tasks.push(task);
    }

    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10);

    return {tasks, activityTimes: {startTime, endTime}};
  }

  async getFirstRechargeList(user) {
    const summary = await UserRechargeOrder.aggregate([
      { $match: { playerId: user._id.toString(), status: 1 } },
      { $group: { _id: null, sum: { $sum: "$price" } } }
    ]).exec();
    let rechargeAmount = 0;
    if (summary.length > 0) {
      rechargeAmount = summary[0].sum;
    }

    // 计算完成任务时间
    let finishTime = null;
    if (rechargeAmount >= 6) {
      const rechargeList = await UserRechargeOrder.find({playerId: user._id.toString(), status: 1});
      let sumaryAmount = 0;

      for (let i = 0; i < rechargeList.length; i++) {
        sumaryAmount += rechargeList[i].price;

        if (sumaryAmount >= 6) {
          finishTime = rechargeList[i].created;
          break;
        }
      }
    }

    const taskList = await NewFirstRecharge.find().lean();
    let tasks = [];

    for (let i = 0; i < taskList.length; i++) {
      const receive = await NewFirstRechargeRecord.count({playerId: user._id, "prizeConfig.day": taskList[i].day});
      taskList[i].receive = !!receive;
    }

    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10);

    return {taskList, activityTimes: {startTime, endTime}, isPay: rechargeAmount >= 6, finishTime};
  }

  // 判断任务是否完成
  async checkTaskState(task) {
    const receiveCount = await NewTaskRecord.count({playerId: this.player._id, taskId: task.taskId});
    task.receive = !!receiveCount;
    const model = await service.playerService.getPlayerModel(this.player._id);
    // 完成10场游戏对局
    if (task.taskId === 1001) {
      task.finish = model.juCount >= task.taskTimes;
      task.finishCount = model.juCount;
    }

    // 完成3场游戏对局胜利
    if (task.taskId === 1002) {
      task.finish = model.juWinCount >= task.taskTimes;
      task.finishCount = model.juWinCount;
    }

    // 完成10次杠牌
    if (task.taskId === 1003) {
      task.finish = model.gangCount >= task.taskTimes;
      task.finishCount = model.gangCount;
    }

    // 商城购买钻石1次(任意金额)
    if (task.taskId === 1004) {
      const orderCount = await DiamondRecord.count({player: this.player._id, type: ConsumeLogType.voucherForDiamond });
      task.finish = orderCount >= task.taskTimes;
      task.finishCount = orderCount;
    }

    // 观看1次广告
    if (task.taskId === 1005) {
      task.finish = task.receive;
      task.finishCount = task.finish ? 1 : 0;
    }

    return task;
  }

  async getNewSignLists(user) {
    const prizeList = await NewSignPrize.find().lean();
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await NewSignPrizeRecord.count({playerId: user._id,
      createAt: {$gte: start, $lt: end}});
    let days = await NewSignPrizeRecord.count({playerId: user._id});
    if (!isTodaySign) {
      days++;
    }

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await NewSignPrizeRecord.count({playerId: user._id, "prizeConfig.day": prizeList[i].day});
      prizeList[i].receive = !!receive;
    }

    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10);

    return {isTodaySign: !!isTodaySign, days, prizeList, activityTimes: {startTime, endTime}};
  }

  async receivePrize(prize, playerId, multiple = 1, type) {
    const user = await Player.findOne({_id: playerId});
    if (prize.type === 1) {
      user.diamond += prize.number * multiple;
      await service.playerService.logGemConsume(user._id, type, prize.number * multiple,
        user.diamond, `新手签到获得${prize.number * multiple}钻石`);
    }

    if (prize.type === 2) {
      user.gold += prize.number * multiple;
      await service.playerService.logGoldConsume(user._id, type, prize.number * multiple,
        user.gold, `新手签到获得${prize.number * multiple}金豆`);
    }

    if (prize.type === 3) {
      const config = await HeadBorder.findOne({propId: prize.propId}).lean();
      let playerHeadBorder = await PlayerHeadBorder.findOne({propId: prize.propId, playerId}).lean();

      // 如果头像框已过期，删除头像框
      if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
        await PlayerHeadBorder.remove({_id: playerHeadBorder._id});
        playerHeadBorder = null;
      }

      if (config && !playerHeadBorder) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerHeadBorder.create(data);
      }
    }

    if (prize.type === 4) {
      const config = await Medal.findOne({propId: prize.propId}).lean();
      let playerMedal = await PlayerMedal.findOne({propId: prize.propId, playerId}).lean();

      // 如果称号已过期，删除称号
      if (playerMedal && playerMedal.times !== -1 && playerMedal.times <= new Date().getTime()) {
        await PlayerMedal.remove({_id: playerMedal._id});
        playerMedal = null;
      }

      if (config && !playerMedal) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerHeadBorder.create(data);
      }
    }

    if (prize.type === 5) {
      const config = await CardTable.findOne({propId: prize.propId}).lean();
      let playerCardTable = await PlayerCardTable.findOne({propId: prize.propId, playerId}).lean();

      // 如果称号已过期，删除称号
      if (playerCardTable && playerCardTable.times !== -1 && playerCardTable.times <= new Date().getTime()) {
        await playerCardTable.remove({_id: playerCardTable._id});
        playerCardTable = null;
      }

      if (config && !playerCardTable) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerCardTable.create(data);
      }
    }

    await user.save();
  }

  async getRechargePartyList(user) {
    const records = await RechargeParty.find().lean();
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    let freeGift = {};
    const rechargeDay1 = [];
    const rechargeDay6 = [];
    const rechargeDay30 = [];
    const partyList1 = [];
    const partyList6 = [];
    const partyList30 = [];

    for (let i = 0; i < records.length; i++) {
      if (records[i].price === 0) {
        freeGift = records[i];
      }

      if (records[i].price === 1) {
        partyList1.push(records[i]);
      }

      if (records[i].price === 6) {
        partyList6.push(records[i]);
      }

      if (records[i].price === 30) {
        partyList30.push(records[i]);
      }
    }

    // 计算每日福利今日是否已领取
    const freeGiftReceiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, prizeId: freeGift["_id"], createAt: {$gte: start, $lt: end}});
    freeGift["receive"] = freeGiftReceiveCount > 0;

    // 计算1元档
    // 计算今日是否已领取
    const party1TodayReceiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, price: 1, createAt: {$gte: start, $lt: end}});
    for (let i= 0; i < partyList1.length; i++) {
      // 计算是否已领取
      const receiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, prizeId: partyList1[i]._id});
      partyList1[i].receive = !!receiveCount;
    }

    // 计算6元档
    // 计算今日是否已领取
    const party6TodayReceiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, price: 6, createAt: {$gte: start, $lt: end}});
    for (let i= 0; i < partyList6.length; i++) {
      // 计算是否已领取
      const receiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, prizeId: partyList6[i]._id});
      partyList6[i].receive = !!receiveCount;
    }

    // 计算30元档
    // 计算今日是否已领取
    const party30TodayReceiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, price: 30, createAt: {$gte: start, $lt: end}});
    for (let i= 0; i < partyList30.length; i++) {
      // 计算是否已领取
      const receiveCount = await PlayerRechargePartyRecord.count({playerId: user._id, prizeId: partyList30[i]._id});
      partyList30[i].receive = !!receiveCount;
    }

    // 用户今日充值金额
    const summary = await UserRechargeOrder.aggregate([
      { $match: { playerId: user._id.toString(), status: 1, created: {$gte: start, $lt: end} } },
      { $group: { _id: null, sum: { $sum: "$price" } } }
    ]).exec();
    let rechargeAmount = 0;
    if (summary.length > 0) {
      rechargeAmount = summary[0].sum;
    }

    // 计算连续充值天数
    for (let i = 0; i < 10; i++) {
      const todayTime = Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * i;
      const currentStart = moment(new Date(todayTime)).startOf('day').toDate();
      const currentEnd = moment(new Date(todayTime)).endOf('day').toDate();

      console.warn(todayTime, currentStart, currentEnd)

      // 用户今日充值金额
      const summary = await UserRechargeOrder.aggregate([
        { $match: { playerId: user._id.toString(), status: 1, created: {$gte: currentStart, $lt: currentEnd} } },
        { $group: { _id: null, sum: { $sum: "$price" } } }
      ]).exec();
      let todayRechargeAmount = 0;
      if (summary.length > 0) {
        todayRechargeAmount = summary[0].sum;

        if (todayRechargeAmount >= 1) {
          rechargeDay1.push(todayRechargeAmount);
        }

        if (todayRechargeAmount >= 6) {
          rechargeDay6.push(todayRechargeAmount);
        }

        if (todayRechargeAmount >= 30) {
          rechargeDay30.push(todayRechargeAmount);
        }
      }
    }

    // 获取活动时间
    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10);

    return {freeGift, partyOne: {todayFinish: rechargeAmount >= 1, todayReceive: party1TodayReceiveCount > 0, lists: partyList1, rechargeDay: rechargeDay1},
      partySix: {todayFinish: rechargeAmount >= 6, todayReceive: party6TodayReceiveCount > 0, lists: partyList6, rechargeDay: rechargeDay6},
      partyThirty: {todayFinish: rechargeAmount >= 30, todayReceive: party30TodayReceiveCount > 0, lists: partyList30, rechargeDay: rechargeDay30},
    activityTime: {startTime, endTime}};
  }
}
