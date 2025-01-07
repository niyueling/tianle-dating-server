import {TianleErrorCode, ConsumeLogType} from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import RegressionSignPrize from "../../database/models/RegressionSignPrize";
import RegressionSignPrizeRecord from "../../database/models/RegressionSignPrizeRecord";
import RegressionRechargeRecord from "../../database/models/RegressionRechargeRecord";
import crypto = require('crypto');
import * as config from '../../config'
import Player from "../../database/models/player";
import {service} from "../../service/importService";
import RegressionTaskRecord from "../../database/models/regressionTaskRecord";
import RegressionTaskTotalPrize from "../../database/models/regressionTaskTotalPrize";
import RegressionTaskTotalPrizeRecord from "../../database/models/regressionTaskTotalPrizeRecord";

export class RegressionApi extends BaseApi {
  // 回归签到
  @addApi()
  async signLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.service.regressionService.getRegressionSignLists(user);

    return this.replySuccess(data);
  }

  // 购买回归签到礼包
  @addApi()
  async payRechargeGift(message) {
    const env = message.env || 0;
    // 获取奖励配置
    const player = await this.service.playerService.getPlayerModel(this.player._id);
    if (!player) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }
    if (!player.openid) {
      return this.replyFail(TianleErrorCode.openidNotFound);
    }
    if (!player.sessionKey) {
      return this.replyFail(TianleErrorCode.sessionKeyNotFound);
    }

    const startTime = player.regressionTime;
    const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);
    const start = moment(startTime).startOf('day').toDate()
    const end = moment(endTime).endOf('day').toDate()

    // 判断是否已经购买
    const receive = await RegressionRechargeRecord.findOne({
      playerId: this.player._id,
      status: 1,
      createAt: {$gte: start, $lt: end}
    });
    if (receive) {
      return this.replyFail(TianleErrorCode.orderNotExistOrPay);
    }

    // 创建购买记录
    const data = {
      playerId: this.player._id.toString(),
      amount: config.game.regressionAmount,
      status: 0,
      sn: await this.service.utils.generateOrderNumber()
    };

    const record = await RegressionRechargeRecord.create(data);
    const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
    const appKey = await this.service.utils.getGlobalConfigByName("appkey");
    const userPostBody = {
      openid: player.openid,
      offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
      ts: Math.floor(Date.now() / 1000),
      zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
      env: env,
      user_ip: this.player.getIpAddress()
    }

    const userPostBodyString = JSON.stringify(userPostBody);

    // 生成登录态签名和支付请求签名
    const signature = crypto.createHmac('sha256', player.sessionKey).update(userPostBodyString).digest('hex');
    const needSignMsg = `/wxa/game/getbalance&${userPostBodyString}`;
    const paySign = crypto.createHmac('sha256', appKey).update(needSignMsg).digest('hex');

    // 查询用户游戏币余额
    const balanceUrl = `https://api.weixin.qq.com/wxa/game/getbalance?access_token=${accessToken}&signature=${signature}&sig_method=hmac_sha256&pay_sig=${paySign}`;
    const response = await this.service.base.postByJson(balanceUrl, userPostBody);
    if (response.data.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    // 如果用户游戏币小于充值数量，通知客户端充值，operate=1
    if (response.data.balance < config.game.regressionAmount * 10) {
      return this.replySuccess({
        "orderId": record["_id"],
        'orderSn': record["sn"],
        "env": env,
        "offerId": userPostBody.offer_id,
        'zoneId': userPostBody.zone_id,
        "currencyType": "CNY",
        "buyQuantity": config.game.regressionAmount * 10,
        "operate": 1
      })
    }

    // 如果用户游戏币大于充值数量，扣除游戏币
    const payBody = {
      openid: player.openid,
      offer_id: userPostBody.offer_id,
      ts: userPostBody.ts,
      zone_id: userPostBody.zone_id,
      env: userPostBody.env,
      user_ip: userPostBody.user_ip,
      amount: config.game.regressionAmount * 10,
      bill_no: record.sn
    }

    // 生成登录态签名和支付请求签名
    const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
    const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
    const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
    const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
    const pay_res = await this.service.base.curl(payUrl, {method: "post", data: payBody});
    const pay_response = JSON.parse(pay_res.data);
    if (pay_response.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    // 虚拟币支付成功，直接购买完成
    const result = this.service.playerService.playerPayRegressionSignGift(record._id, pay_response.bill_no);
    if (!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    pay_response.operate = 2;

    return this.replySuccess(pay_response);
  }

  // 安卓虚拟支付回调
  @addApi()
  async wxPayRechargeGiftNotify(message) {
    const env = message.env || 0;
    const order = await RegressionRechargeRecord.findOne({_id: message.orderId});
    if (!order || order.status === 1) {
      return this.replyFail(TianleErrorCode.orderNotExistOrPay);
    }

    const player = await this.service.playerService.getPlayerModel(order.playerId);
    if (!player || !player.openid || !player.sessionKey) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
    const appKey = await this.service.utils.getGlobalConfigByName("appkey");
    const userPostBody = {
      openid: player.openid,
      offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
      ts: Math.floor(Date.now() / 1000),
      zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
      env: env,
      user_ip: this.player.getIpAddress()
    }
    const userPostBodyString = JSON.stringify(userPostBody);

    // 生成登录态签名和支付请求签名
    const signature = crypto.createHmac('sha256', player.sessionKey).update(userPostBodyString).digest('hex');
    const needSignMsg = `/wxa/game/getbalance&${userPostBodyString}`;
    const paySign = crypto.createHmac('sha256', appKey).update(needSignMsg).digest('hex');
    // 查询用户游戏币余额
    const balanceUrl = `https://api.weixin.qq.com/wxa/game/getbalance?access_token=${accessToken}&signature=${signature}&sig_method=hmac_sha256&pay_sig=${paySign}`;
    const response = await this.service.base.postByJson(balanceUrl, userPostBody);
    if (response.data.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    if (response.data.balance < config.game.regressionAmount * 10) {
      return this.replyFail(TianleErrorCode.gameBillInsufficient);
    }

    // 如果用户游戏币大于充值数量，扣除游戏币
    const payBody = {
      openid: player.openid,
      offer_id: userPostBody.offer_id,
      ts: userPostBody.ts,
      zone_id: userPostBody.zone_id,
      env: userPostBody.env,
      user_ip: userPostBody.user_ip,
      amount: config.game.regressionAmount * 10,
      bill_no: order._id
    }

    // 生成登录态签名和支付请求签名
    const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
    const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
    const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
    const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
    const pay_response = await this.service.base.postByJson(payUrl, payBody);
    if (pay_response.data.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    const result = await this.service.playerService.playerPayRegressionSignGift(order._id, pay_response.data.bill_no);
    if (!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    this.replySuccess(order);
  }

  // 领取回归签到奖励
  @addApi({
    rule: {
      prizeId: 'string',
    }
  })
  async signIn(message) {
    const player = await this.service.playerService.getPlayerModel(this.player._id);

    const startTime = player.regressionTime;
    const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);

    // 判断是否已经购买
    const payCount = await RegressionRechargeRecord.count({
      playerId: player._id,
      status: 1,
      createAt: {$gte: startTime, $lt: endTime}
    });

    // 获取奖励配置
    const prizeInfo = await RegressionSignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    let receiveInfo = await RegressionSignPrizeRecord.findOne({playerId: this.player._id, day: prizeInfo.day});
    // 如果今日免费奖品已领取，不能重复领取
    if (receiveInfo && receiveInfo.freeReceive && message.type === 1) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }
    // 如果今日付费奖品已领取，不能重复领取
    if (receiveInfo && receiveInfo.payReceive && message.type === 2) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 领取免费奖品
    if (message.type === 1) {
      if (receiveInfo) {
        receiveInfo.freeReceive = true;
      }

      for (let i = 0; i < prizeInfo.freePrizeList.length; i++) {
        await this.service.playerService.receivePrize(prizeInfo.freePrizeList[i], this.player._id, 1, ConsumeLogType.receiveRegressionSignin);
      }
    }

    // 领取付费奖品
    if (message.type === 2) {
      if (payCount === 0) {
        return this.replyFail(TianleErrorCode.payFail);
      }

      if (receiveInfo) {
        receiveInfo.payReceive = true;
      }

      for (let i = 0; i < prizeInfo.payPrizeList.length; i++) {
        await this.service.playerService.receivePrize(prizeInfo.payPrizeList[i], this.player._id, 1, ConsumeLogType.receiveRegressionSignin);
      }
    }

    if (receiveInfo) {
      await receiveInfo.save();
    } else {
      // 创建领取记录
      const data = {
        playerId: this.player._id,
        prizeId: prizeInfo._id,
        day: prizeInfo.day,
        freeReceive: message.type === 1,
        payReceive: message.type === 2,
        prizeConfig: prizeInfo
      };

      receiveInfo = await RegressionSignPrizeRecord.create(data);
    }


    await this.player.updateResource2Client();
    return this.replySuccess(receiveInfo);
  }

  // 一键领取新手签到
  @addApi()
  async oneTouchSignIn() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const player = await this.service.playerService.getPlayerModel(this.player._id);

    const startTime = player.regressionTime;
    const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);

    // 判断是否已经购买
    const payCount = await RegressionRechargeRecord.count({
      playerId: player._id,
      status: 1,
      createAt: {$gte: startTime, $lt: endTime}
    });

    let lastReceiveInfo = await RegressionSignPrizeRecord.find({playerId: user._id}).sort({createAt: -1}).limit(1);
    let days = !lastReceiveInfo.length ? 1 : lastReceiveInfo[0].day;
    // 如果没有领取记录，则可以领取第一天的数据
    if (!lastReceiveInfo.length) {
      days = 1;
    }
    const todayStart = moment(new Date()).startOf('day').toDate().toString();
    // 最后一次领取时间是今天之前，则可领取天数+1
    if (lastReceiveInfo.length > 0 && Date.parse(lastReceiveInfo[0].createAt) < Date.parse(todayStart)) {
      days++;
    }
    const receiveFreeDatas = [];
    const receivePayDatas = [];

    for (let i = 1; i <= days; i++) {
      const receiveResult = await this.service.regressionService.onceReceive(this.player, i, payCount > 0);
      if (receiveResult) {
        receiveFreeDatas.push(receiveResult.freePrizeList);
        receivePayDatas.push(receiveResult.payPrizeList);
      }
    }

    return this.replySuccess({receiveFreeDatas, receivePayDatas});
  }

  // 回归任务列表
  @addApi()
  async taskLists(message) {
    const user = await Player.findOne({_id: this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const taskData = await this.service.regressionService.getDailyTaskData(message, user);

    return this.replySuccess(taskData);
  }

  @addApi()
  async finishTask(message) {
    const user = await Player.findOne({_id: this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const result = await this.service.regressionService.finishDailyTaskOnce(message, user);
    if (!result.code) {
      return this.replyFail(result.info);
    }

    await this.player.updateResource2Client();
    return this.replySuccess(result.result);
  }

  // 领取每日活跃礼包
  @addApi()
  async receiveTaskTodayActivity(message) {
    const user = await Player.findOne({_id:this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    // 计算活跃度
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const liveness = await RegressionTaskRecord.aggregate([
      { $match: { playerId: user._id.toString(), createAt: {$gte: start, $lt: end} } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取奖励配置
    const prizeInfo = await RegressionTaskTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    if (livenessCount < prizeInfo.liveness) {
      return this.replyFail(TianleErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await RegressionTaskTotalPrizeRecord.findOne({playerId: user._id, prizeId: prizeInfo._id, createAt: {$gte: start, $lt: end}});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.taskPrizes.length; i++) {
      await service.playerService.receivePrize(prizeInfo.taskPrizes[i], user._id, 1, ConsumeLogType.receiveRegressionTask);
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo
    };

    const record = await RegressionTaskTotalPrizeRecord.create(data);
    await this.player.updateResource2Client();

    return this.replySuccess(record);
  }

  // 领取每日活跃礼包
  @addApi()
  async receiveTaskTotalActivity(message) {
    const user = await Player.findOne({_id:this.player._id});

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    // 计算活跃度
    const liveness = await RegressionTaskRecord.aggregate([
      { $match: { playerId: user._id.toString() } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取奖励配置
    const prizeInfo = await RegressionTaskTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    if (livenessCount < prizeInfo.liveness) {
      return this.replyFail(TianleErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await RegressionTaskTotalPrizeRecord.findOne({playerId: user._id, prizeId: prizeInfo._id});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.taskPrizes.length; i++) {
      await service.playerService.receivePrize(prizeInfo.taskPrizes[i], user._id, 1, ConsumeLogType.receiveRegressionTask);
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo
    };

    const record = await RegressionTaskTotalPrizeRecord.create(data);
    await this.player.updateResource2Client();

    return this.replySuccess(record);
  }
}
