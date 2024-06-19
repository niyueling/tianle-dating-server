import GoodsModel from "../../database/models/goods";
import {addApi, BaseApi} from "./baseApi";
import {ConsumeLogType, RedisKey, TianleErrorCode, TianLeGameCurrency} from "@fm/common/constants";
import UserRechargeOrder from "../../database/models/userRechargeOrder";
import PlayerModel from "../../database/models/player";
import crypto = require('crypto');
import {service} from "../../service/importService";
import FreeGoldRecord from "../../database/models/freeGoldRecord";
import * as moment from "moment";
import GoodsReviveRuby from "../../database/models/goodsReviveRuby";
import Player from "../../database/models/player";
import Goods from "../../database/models/goods";
import DiamondRecord from "../../database/models/diamondRecord";
import NewDiscountGift from "../../database/models/NewDiscountGift";
import NewDiscountGiftRecord from "../../database/models/NewDiscountGiftRecord";
import HeadBorder from "../../database/models/HeadBorder";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import GoodsHeadBorder from "../../database/models/GoodsHeadBorder";
import GoodsBeautyNumber from "../../database/models/GoodsBeautyNumber";
import PlayerBeautyNumberRecord from "../../database/models/PlayerBeautyNumberRecord";
import GoodsExchangeCurrency from "../../database/models/goodsExchangeCurrency";
import * as config from '../../config'
import GoodsProp from "../../database/models/GoodsProp";
import PlayerProp from "../../database/models/PlayerProp";

// 商品
export class GoodsApi extends BaseApi {
  // 商城列表
  @addApi()
  async getGoodsList(message) {
    const diamondRechargeList = await GoodsModel.find({ isOnline: true, goodsType: 1 }).sort({price: 1}).lean();
    const goldRechargeList = await GoodsModel.find({ isOnline: true, goodsType: 2 }).sort({price: 1}).lean();
    const tianleRechargeList = await GoodsModel.find({ isOnline: true, goodsType: 3 }).sort({price: 1}).lean();
    const goldExchangeList = await GoodsExchangeCurrency.find({currency: TianLeGameCurrency.gold}).sort({diamond: 1}).lean();
    const tianleExchangeList = await GoodsExchangeCurrency.find({currency: TianLeGameCurrency.tianle}).sort({diamond: 1}).lean();
    const headLists = await GoodsHeadBorder.find().lean();
    const propLists = await GoodsProp.find().lean();
    let param = {_id: {$ne: null}};
    if (message.numberId) {
      param["numberId"] = message.numberId;
    }

    const beautyNumberLists = await GoodsBeautyNumber.aggregate([
      {$match: param},
      {$sample: { size: 20}}
    ]);

    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    // 兑换金豆
    let goldList = [];
    for (let i = 0; i < goldExchangeList.length; i++) {
      let params = {
        _id: goldExchangeList[i]._id,
        diamond: goldExchangeList[i].diamond,
        number: goldExchangeList[i].number,
        receive: false
      }
      if (goldExchangeList[i].diamond === 0) {
        // 判断今日是否领取
        const count = await FreeGoldRecord.count({playerId: this.player.model._id, goodsId: goldExchangeList[i]._id, createAt: {$gte: start, $lt: end}});
        params.receive = !!count;
      }

      goldList.push(params);
    }

    // 兑换天乐豆
    let tianleList = [];
    for (let i = 0; i < tianleExchangeList.length; i++) {
      let params = {
        _id: tianleExchangeList[i]._id,
        diamond: tianleExchangeList[i].diamond,
        number: tianleExchangeList[i].number,
        receive: false
      }
      if (tianleExchangeList[i].diamond === 0) {
        // 判断今日是否领取
        const count = await FreeGoldRecord.count({playerId: this.player.model._id, goodsId: tianleExchangeList[i]._id, createAt: {$gte: start, $lt: end}});
        params.receive = !!count;
      }

      tianleList.push(params);
    }

    // 判断钻石是否首充
    for (let i = 0; i < diamondRechargeList.length; i++) {
      //判断用户是否首次充值该模板
      const orderCount = await UserRechargeOrder.count({playerId: this.player._id, status: 1, goodsId: diamondRechargeList[i]._id });
      diamondRechargeList[i].isFirst = orderCount === 0;
    }

    // 判断金豆是否首充
    for (let i = 0; i < goldRechargeList.length; i++) {
      //判断用户是否首次充值该模板
      const orderCount = await UserRechargeOrder.count({playerId: this.player._id, status: 1, goodsId: goldRechargeList[i]._id });
      goldRechargeList[i].isFirst = orderCount === 0;
    }

    // 判断天乐豆是否首充
    for (let i = 0; i < tianleRechargeList.length; i++) {
      //判断用户是否首次充值该模板
      const orderCount = await UserRechargeOrder.count({playerId: this.player._id, status: 1, goodsId: tianleRechargeList[i]._id });
      tianleRechargeList[i].isFirst = orderCount === 0;
    }

    // 靓号是否被使用
    for (let i = 0; i < beautyNumberLists.length; i++) {
      //判断Id是否被使用
      const orderCount = await Player.count({shortId: beautyNumberLists[i].numberId });
      beautyNumberLists[i].isPay = orderCount === 0;
    }

    // 头像框是否被使用
    for (let i = 0; i < headLists.length; i++) {
      headLists[i].isUse = false;
      headLists[i].isGive = false;
      headLists[i].isAlways = false;
      //判断用户是否拥有头像框
      const playerHeadBorder = await PlayerHeadBorder.findOne({playerId: this.player._id, propId: headLists[i].propId });
      if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
        await PlayerHeadBorder.remove({playerId: this.player._id, propId: headLists[i].propId });
      }

      if (playerHeadBorder && (playerHeadBorder.times === -1 || playerHeadBorder.times >= new Date().getTime())) {
        headLists[i].isUse = playerHeadBorder.isUse;
        headLists[i].isGive = true;
        headLists[i].isAlways = playerHeadBorder.times === -1;
        headLists[i].times = playerHeadBorder.times;
      }
    }

    // 道具状态
    for (let i = 0; i < propLists.length; i++) {
      propLists[i].isGive = false;
      propLists[i].isAlways = false;
      propLists[i].number = 0;
      //判断用户是否拥有道具
      const playerProp = await PlayerProp.findOne({playerId: this.player._id, propId: propLists[i].propId });
      if (playerProp) {
        // 如果是按天收费类型，判断是否过期
        if (playerProp.payType === 1) {
          if (playerProp.times !== -1 && playerProp.times <= new Date().getTime()) {
            await PlayerProp.remove({playerId: this.player._id, propId: propLists[i].propId });
          }

          // 如果是按天收费类型，判断是否持有永久道具
          if ((playerProp.times === -1 || playerProp.times >= new Date().getTime())) {
            propLists[i].isGive = true;
            propLists[i].isAlways = playerProp.times === -1;
            propLists[i].times = playerProp.times;
          }
        }

        if (playerProp.payType === 2) {
          // 如果是按次收费类型，记录用户剩余次数
          if (playerProp.payType === 2 && playerProp.number === 0) {
            await PlayerProp.remove({playerId: this.player._id, propId: propLists[i].propId });
          }

          if (playerProp.payType === 2 && playerProp.number > 0) {
            propLists[i].isGive = true;
            propLists[i].number = playerProp.number;
          }
        }
      }

      // 按天收费删除数量字段，按次收费删除永久字段
      propLists[i].payType === 1 ? delete propLists[i].number : delete propLists[i].isAlways;
    }

    this.replySuccess({
      recharge: {diamondCurrency: diamondRechargeList, goldCurrency: goldRechargeList, tianleCurrency: tianleRechargeList},
      exchange: {goldList, tianleList},
      config: {diamondToGold: config.game.diamondToGold, diamondToTianLe: config.game.diamondToTianLe, goldToTianLe: config.game.goldToTianLe },
      headLists,
      propLists,
      beautyNumberLists
    });
  }

  // 钻石兑换金豆
  @addApi()
  async diamond2gold(message) {
    let exchangeConf = await GoodsExchangeCurrency.findById(message._id);
    // 兼容旧接口，如果没传_id和diamond
    if (!exchangeConf) {
      if (!message.diamond) {
        return this.replyFail(TianleErrorCode.configNotFound);
      }

      exchangeConf = {
        diamond: message.diamond,
        number: message.diamond * config.game.diamondToGold
      }
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (exchangeConf.diamond > model.diamond && exchangeConf.diamond > 0) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -exchangeConf.diamond, gold: exchangeConf.number}});
    this.player.model.diamond = model.diamond - exchangeConf.diamond;
    this.player.model.gold = model.gold + exchangeConf.number;
    await service.playerService.logGemConsume(model._id, ConsumeLogType.gemForRuby, -exchangeConf.diamond, this.player.model.diamond, `钻石兑换金豆`);
    await service.playerService.logGoldConsume(model._id, ConsumeLogType.diamondToGold, exchangeConf.number, this.player.model.gold, `钻石兑换金豆`);

    this.replySuccess({diamond: exchangeConf.diamond, gold: exchangeConf.number});
    await this.player.updateResource2Client();
  }

  // 钻石兑换天乐豆
  @addApi()
  async diamond2tianle(message) {
    let exchangeConf = await GoodsExchangeCurrency.findById(message._id);
    // 兼容旧接口，如果没传_id和diamond
    if (!exchangeConf) {
      if (!message.diamond) {
        return this.replyFail(TianleErrorCode.configNotFound);
      }

      exchangeConf = {
        diamond: message.diamond,
        number: message.diamond * config.game.diamondToTianLe
      }
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (exchangeConf.diamond > model.diamond && exchangeConf.diamond > 0) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -exchangeConf.diamond, tlGold: exchangeConf.number}});
    this.player.model.diamond = model.diamond - exchangeConf.diamond;
    this.player.model.tlGold = model.tlGold + exchangeConf.number;
    await service.playerService.logGemConsume(model._id, ConsumeLogType.gemForRuby, -exchangeConf.diamond, this.player.model.diamond, `钻石兑换天乐豆`);
    await service.playerService.logGoldConsume(model._id, ConsumeLogType.diamondToTlGold, exchangeConf.number, this.player.model.tlGold, `钻石兑换天乐豆`);

    this.replySuccess({diamond: exchangeConf.diamond, tlGold: exchangeConf.number});
    await this.player.updateResource2Client();
  }

  // 金豆兑换天乐豆
  @addApi()
  async gold2tianle(message) {
    const exchangeConf = {
      gold: message.gold,
      number: message.gold * config.game.goldToTianLe
    };

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (exchangeConf.gold > model.gold) {
      return this.replyFail(TianleErrorCode.goldInsufficient);
    }

    await PlayerModel.update({_id: model._id}, {$inc: {gold: -exchangeConf.gold, tlGold: exchangeConf.number}});
    this.player.model.gold = model.gold - exchangeConf.gold;
    this.player.model.tlGold = model.tlGold + exchangeConf.number;
    await service.playerService.logGoldConsume(model._id, ConsumeLogType.goldToTlGold, -exchangeConf.gold, this.player.model.tlGold, `金豆兑换天乐豆`);

    this.replySuccess({gold: exchangeConf.gold, tlGold: exchangeConf.number});
    await this.player.updateResource2Client();
  }

  // 安卓虚拟支付
  @addApi()
  async wxGameRecharge(message) {
    const lock = await service.utils.grantLockOnce(RedisKey.inviteWithdraw + message.userId, 5);
    if (!lock) {
      // 有进程在处理
      console.log('another processing')
      return;
    }

    const template = await GoodsModel.findOne({ isOnline: true, _id: message._id }).lean();
    if (!template) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    //判断用户是否充值过该模板
    const orderCount = await UserRechargeOrder.count({playerId: message.userId, status: 1, goodsId: message._id });
    const rechargeCount = await UserRechargeOrder.count({playerId: message.userId, status: 1 });
    message.award = orderCount > 0 ? 0 : template.firstTimeAmount;
    message.price = template.price;

    // 获取用户信息，判断openid和session_key是否绑定
    const player = await PlayerModel.findOne({_id: message.userId}).lean();
    if (!player.openid) {
      return this.replyFail(TianleErrorCode.openidNotFound);
    }
    if (!player.sessionKey) {
      return this.replyFail(TianleErrorCode.sessionKeyNotFound);
    }

    const data = {
      playerId: message.userId,
      shortId: player.shortId,
      diamond: rechargeCount > 0 ? template.amount : template.amount * 10,
      price: template.price,
      goodsId: template._id,
      source: "wechat",
      sn: await this.service.utils.generateOrderNumber(),
      status: 0
    }
    const record = await UserRechargeOrder.create(data);
    const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
    const appKey = await this.service.utils.getGlobalConfigByName("appkey");
    const userPostBody = {
      openid: player.openid,
      offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
      ts: Math.floor(Date.now() / 1000),
      zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
      env: message.env,
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
    console.warn(response)
    if (response.data.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    // 如果用户游戏币小于充值数量，通知客户端充值，operate=1
    if (response.data.balance < data.price * 10) {
      return this.replySuccess({
        "orderId": record["_id"],
        'orderSn': record["sn"],
        "env": message.env,
        "offerId": userPostBody.offer_id,
        'zoneId': userPostBody.zone_id,
        "currencyType": "CNY",
        "buyQuantity": record.price * 10,
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
      amount: data.price * 10,
      bill_no: record._id
    }

    // 生成登录态签名和支付请求签名
    const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
    const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
    const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
    const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
    const pay_res = await this.service.base.curl(payUrl, { method: "post", data: payBody});
    const pay_response = JSON.parse(pay_res.data);
    if (pay_response.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    const result = this.service.playerService.playerRecharge(record._id, pay_response.bill_no);
    if(!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    pay_response.operate = 2;

    return this.replySuccess(pay_response);
  }

  // 免费领取金豆
  @addApi()
  async receiveFreeGold() {
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    const goodInfo = await GoodsExchangeCurrency.findOne({diamond: 0, currency: TianLeGameCurrency.gold}).lean();
    if (!goodInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断今日是否领取
    const count = await FreeGoldRecord.count({playerId: this.player.model._id, goodsId: goodInfo._id, createAt: {$gte: start, $lt: end}});
    if (count > 0) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    let user = await this.service.playerService.getPlayerModel(this.player.model._id);
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    user.gold += goodInfo.number;
    user.shopFreeGiftCount++;
    user.save();

    await service.playerService.logGoldConsume(user._id, ConsumeLogType.freeShopGold, goodInfo.number, user.gold, `每日领取免费金豆`);

    // 记录日志
    const record = await FreeGoldRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      gold: goodInfo.number,
      goodsId:goodInfo._id,
      config: goodInfo
    });

    await this.player.updateResource2Client();

    return this.replySuccess(record);
  }

  // 免费领取天乐豆
  @addApi()
  async receiveFreeTlGold() {
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    const goodInfo = await GoodsExchangeCurrency.findOne({diamond: 0, currency: TianLeGameCurrency.tianle}).lean();
    if (!goodInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断今日是否领取
    const count = await FreeGoldRecord.count({playerId: this.player.model._id, goodsId: goodInfo._id, createAt: {$gte: start, $lt: end}});
    if (count > 0) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    let user = await this.service.playerService.getPlayerModel(this.player.model._id);
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    user.tlGold += goodInfo.number;
    user.shopFreeGiftCount++;
    user.save();

    await service.playerService.logGoldConsume(user._id, ConsumeLogType.freeShopGold, goodInfo.number, user.tlGold, `每日领取免费金豆`);

    // 记录日志
    const record = await FreeGoldRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      gold: goodInfo.number,
      goodsId:goodInfo._id,
      config: goodInfo
    });

    await this.player.updateResource2Client();

    return this.replySuccess(record);
  }

  // 安卓虚拟支付回调
  @addApi()
  async wxGameRechargeNotify(message) {
    const order = await UserRechargeOrder.findOne({_id: message.orderId});
    if (!order || order.status === 1) {
      return this.replyFail(TianleErrorCode.orderNotExistOrPay);
    }

    const player = await PlayerModel.findOne({_id: order.playerId});
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
      env: message.env,
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

    if (response.data.balance < order.price * 10) {
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
      amount: order.price * 10,
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

    const result = await this.service.playerService.playerRecharge(order._id, pay_response.data.bill_no);
    if(!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    this.replySuccess(order);

    // 如果是对局兑换礼包充值，则直接兑换礼包金豆
    if (message.isGameExchange) {
      const exchangeConf = await GoodsReviveRuby.findOne({_id: message.giftId});
      const user = await Player.findOne({_id: this.player._id});
      if (user.diamond < exchangeConf.diamond) {
        return this.replyFail(TianleErrorCode.diamondInsufficient);
      }

      await PlayerModel.update({_id: this.player._id}, {$inc: {diamond: -exchangeConf.diamond, gold: exchangeConf.gold}});
      this.player.model.diamond = user.diamond - exchangeConf.diamond;
      this.player.model.gold = user.gold + exchangeConf.gold;

      // 增加日志
      await service.playerService.logGemConsume(user._id, ConsumeLogType.gemForRuby, -exchangeConf.diamond, this.player.model.diamond, `购买超值礼包`);
      // 记录金豆日志
      await service.playerService.logGoldConsume(user._id, ConsumeLogType.diamondToGold, exchangeConf.gold, this.player.model.gold, `钻石兑换金豆`);

      this.player.sendMessage("goods/nextExchangeGoldReply", {ok: true, data: {diamond: exchangeConf.diamond, gold: exchangeConf.gold}});
    }

    await this.player.updateResource2Client();
  }

  // 下一局金豆礼包
  @addApi()
  async getNextGift(message) {
    const rubyList = await GoodsReviveRuby.find({category: message.categoryId}).sort({gold: 1});

    this.replySuccess({ rubyInfo: rubyList[1] });
  }

  // 下一局兑换金豆
  @addApi()
  async nextExchangeGold(message) {
    const exchangeConf = await GoodsReviveRuby.findOne({_id: message._id});
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.diamond < exchangeConf.diamond) {
      const goodsList = await GoodsModel.find({isOnline: true}).lean();
      const index = goodsList.findIndex((good) => good.amount >= exchangeConf.diamond);
      return this.replyFail(TianleErrorCode.diamondInsufficient, {good: goodsList[index]});
    }

    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -exchangeConf.diamond, gold: exchangeConf.gold}});
    this.player.model.diamond = model.diamond - exchangeConf.diamond;
    this.player.model.gold = model.gold + exchangeConf.gold;

    // 增加日志
    await service.playerService.logGemConsume(model._id, ConsumeLogType.gemForRuby, -exchangeConf.diamond, this.player.model.diamond, `购买超值礼包`);
    // 记录金豆日志
    await service.playerService.logGoldConsume(model._id, ConsumeLogType.diamondToGold, exchangeConf.gold, this.player.model.gold, `钻石兑换金豆`);

    this.replySuccess({diamond: exchangeConf.diamond, gold: exchangeConf.gold});
    await this.player.updateResource2Client();
  }

  // 安卓虚拟支付(购买代金券,2024.06.18修改成充值钻石)
  @addApi()
  async voucherRecharge(message) {
    const lock = await service.utils.grantLockOnce(RedisKey.voucherRechargeLock + message.userId, 5);
    if (!lock) {
      // 有进程在处理
      console.log('another processing');
      return;
    }

    const template = await GoodsModel.findOne({ isOnline: true, goodsType: 1, _id: message._id }).lean();
    if (!template) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    //判断用户是否首次充值该模板
    const orderCount = await UserRechargeOrder.count({playerId: message.userId, status: 1, goodsId: message._id });

    // 获取用户信息，判断openid和session_key是否绑定
    const player = await PlayerModel.findOne({_id: message.userId}).lean();
    if (!player.openid) {
      return this.replyFail(TianleErrorCode.openidNotFound);
    }
    if (!player.sessionKey) {
      return this.replyFail(TianleErrorCode.sessionKeyNotFound);
    }

    const data = {
      playerId: message.userId,
      shortId: player.shortId,
      diamond: template.amount + (orderCount > 0 ? 0 : template.firstTimeAmount) + template.originPrice,
      price: template.price,
      goodsId: template._id,
      source: "wechat",
      sn: await this.service.utils.generateOrderNumber(),
      status: 0
    }
    const record = await UserRechargeOrder.create(data);
    const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
    const appKey = await this.service.utils.getGlobalConfigByName("appkey");
    const userPostBody = {
      openid: player.openid,
      offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
      ts: Math.floor(Date.now() / 1000),
      zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
      env: message.env,
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
    console.warn(response)
    if (response.data.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    // 如果用户游戏币小于充值数量，通知客户端充值，operate=1
    if (response.data.balance < data.price * 10) {
      return this.replySuccess({
        "orderId": record["_id"],
        'orderSn': record["sn"],
        "env": message.env,
        "offerId": userPostBody.offer_id,
        'zoneId': userPostBody.zone_id,
        "currencyType": "CNY",
        "buyQuantity": record.price * 10,
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
      amount: data.price * 10,
      bill_no: record._id
    }

    // 生成登录态签名和支付请求签名
    const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
    const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
    const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
    const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
    const pay_res = await this.service.base.curl(payUrl, { method: "post", data: payBody});
    const pay_response = JSON.parse(pay_res.data);
    if (pay_response.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    const result = this.service.playerService.playerVoucherRecharge(record._id, pay_response.bill_no);
    if(!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    pay_response.operate = 2;

    return this.replySuccess(pay_response);
  }

  // 安卓虚拟支付回调(购买代金券回调)
  @addApi()
  async voucherRechargeNotify(message) {
    const order = await UserRechargeOrder.findOne({_id: message.orderId});
    if (!order || order.status === 1) {
      return this.replyFail(TianleErrorCode.orderNotExistOrPay);
    }

    const player = await PlayerModel.findOne({_id: order.playerId});
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
      env: message.env,
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

    if (response.data.balance < order.price * 10) {
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
      amount: order.price * 10,
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

    const result = await this.service.playerService.playerVoucherRecharge(order._id, pay_response.data.bill_no);
    if(!result) {
      return this.replyFail(TianleErrorCode.payFail);
    }

    this.replySuccess(order);

    await this.player.updateResource2Client();
  }

  // 代金券兑换钻石
  @addApi()
  async voucher2diamond(message) {
    const exchangeConf = await Goods.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.voucher < exchangeConf.price) {
      return this.replyFail(TianleErrorCode.voucherInsufficient);
    }

    const orderCount = await DiamondRecord.count({player: this.player._id, type: ConsumeLogType.voucherForDiamond, propId: exchangeConf._id });
    let diamond = exchangeConf.amount + exchangeConf.originPrice;
    if (orderCount === 0) {
      diamond += exchangeConf.firstTimeAmount;
    }

    await PlayerModel.update({_id: model._id}, {$inc: {voucher: -exchangeConf.price, diamond}});
    this.player.model.diamond = model.diamond + diamond;
    // 增加日志
    await service.playerService.logGemConsume(model._id, ConsumeLogType.voucherForDiamond, diamond, this.player.model.diamond, `成功兑换${exchangeConf.price}代金券成${diamond}钻石`, exchangeConf._id);

    this.replySuccess({diamond: diamond, voucher: exchangeConf.price});
    await this.player.updateResource2Client();
  }

  // 新人礼包
  @addApi()
  async getNewDisCountGift() {
    const giftInfo = await NewDiscountGift.findOne();
    const payCount = await NewDiscountGiftRecord.count({playerId: this.player._id.toString(), prizeId: giftInfo._id});
    giftInfo.isPay = payCount === 0;

    this.replySuccess(giftInfo);
  }

  // 钻石购买新手礼包
  @addApi()
  async payNewDisCountGift(message) {
    const exchangeConf = await NewDiscountGift.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.diamond < exchangeConf.price) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    const payCount = await NewDiscountGiftRecord.count({playerId: this.player._id.toString(), prizeId: exchangeConf._id});
    if(payCount > 0) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    model.diamond -= exchangeConf.price;
    await model.save();

    for (let i = 0; i < exchangeConf.prizeList.length; i++) {
      await service.playerService.receivePrize(exchangeConf.prizeList[i], this.player._id, message.multiple, ConsumeLogType.payNewDisCountGift);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: exchangeConf._id,
      prizeConfig: exchangeConf,
      multiple: message.multiple,
      createAt: new Date()
    };

    await NewDiscountGiftRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 购买头像框
  @addApi()
  async payHeadBorder(message) {
    const exchangeConf = await GoodsHeadBorder.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const price = exchangeConf.priceList.find(item => item.day === message.day)?.price;
    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.diamond < price) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    // 录入头像框数据
    const config = await HeadBorder.findOne({propId: exchangeConf.propId}).lean();
    let playerHeadBorder = await PlayerHeadBorder.findOne({propId: exchangeConf.propId, playerId: model._id}).lean();

    // 如果头像框已过期，删除头像框
    if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
      await PlayerHeadBorder.remove({_id: playerHeadBorder._id});
      playerHeadBorder = null;
    }

    // 如果头像框已经是永久，则禁止购买
    if (playerHeadBorder && playerHeadBorder.times === -1) {
      return this.replyFail(TianleErrorCode.headBorderIsAlways);
    }

    // 如果用户未拥有头像框，则录入数据
    if (config && !playerHeadBorder) {
      const data = {
        propId: exchangeConf.propId,
        playerId: model._id,
        shortId: model.shortId,
        times: message.day !== -1 ? (new Date().getTime() + 1000 * 60 * 60 * 24 * message.day) : -1,
        isUse: false
      }

      await PlayerHeadBorder.create(data);
    }

    // 如果用户已经拥有头像框，则在过期时间加上有效时间
    if (config && playerHeadBorder) {
      await PlayerHeadBorder.update({playerId: model._id, propId: exchangeConf.propId}, {$set: {times: message.day !== -1 ? (playerHeadBorder.times + 1000 * 60 * 60 * 24 * message.day) : -1}})
    }

    // 扣除钻石
    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -price}});
    this.player.model.diamond = model.diamond - price;
    // 增加日志
    await service.playerService.logGemConsume(model._id, ConsumeLogType.payHeadBorder, -price, this.player.model.diamond, `花费${price}钻石购买${exchangeConf.name}头像框`, exchangeConf._id);

    this.replySuccess({price, day: message.day, propId: exchangeConf.propId});
    await this.player.updateResource2Client();
  }

  // 钻石兑换靓号
  @addApi()
  async payBeautyNumber(message) {
    const exchangeConf = await GoodsBeautyNumber.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.diamond < exchangeConf.price) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    //判断Id是否被使用
    const orderCount = await Player.count({shortId: exchangeConf.numberId });
    if (orderCount) {
      return this.replyFail(TianleErrorCode.beautyNumberInvalid);
    }

    const data = {
      playerId: model._id,
      oldShortId: model.shortId,
      newShortId: exchangeConf.numberId,
      price: exchangeConf.price,
      currency: exchangeConf.currency,
    }

    await PlayerBeautyNumberRecord.create(data);

    // 扣除钻石
    model.diamond -= exchangeConf.price;
    model.shortId = exchangeConf.numberId;
    await model.save();
    this.player.model.diamond = model.diamond - exchangeConf.price;
    this.player.model.shortId = exchangeConf.numberId;
    await service.playerService.logGemConsume(model._id, ConsumeLogType.payBeautyNumber, -exchangeConf.price, this.player.model.diamond, `花费${exchangeConf.price}钻石购买${exchangeConf.numberId}靓号`, exchangeConf._id);

    this.replySuccess({price: exchangeConf.price, numberId: exchangeConf.numberId});
    await this.player.updateResource2Client();
  }

  // 靓号换一换
  @addApi()
  async beautyNumberLists(message) {
    let param = {_id: {$ne: null}};
    if (message.numberId) {
      param["numberId"] = message.numberId;
    }

    console.log(param);

    const beautyNumberLists = await GoodsBeautyNumber.aggregate([
      {$match: param},
      {$sample: { size: 20}}
    ]);

    for (let i = 0; i < beautyNumberLists.length; i++) {
      //判断Id是否被使用
      const orderCount = await Player.count({shortId: beautyNumberLists[i].numberId });
      beautyNumberLists[i].isPay = orderCount === 0;
    }

    return this.replySuccess(beautyNumberLists);
  }

  // 购买道具
  @addApi()
  async payProp(message) {
    const exchangeConf = await GoodsProp.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const price = exchangeConf.priceList.find(item => item.count === message.number)?.price;
    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.diamond < price) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    // 录入道具数据
    let playerProp = await PlayerProp.findOne({propId: exchangeConf.propId, playerId: model._id}).lean();

    // 如果道具已过期或者个数为0，删除道具
    if (playerProp && ((playerProp.payType === 1 && playerProp.times !== -1 && playerProp.times <= new Date().getTime()) ||
      (playerProp.payType === 2 && playerProp.number === 0))) {
      await PlayerProp.remove({_id: playerProp._id});
      playerProp = null;
    }

    // 如果道具已经是永久，则禁止购买
    if (playerProp && playerProp.payType === 1 && playerProp.times === -1) {
      return this.replyFail(TianleErrorCode.headBorderIsAlways);
    }

    // 如果用户未拥有道具，则录入数据
    if (!playerProp) {
      const data = {
        propId: exchangeConf.propId,
        playerId: model._id,
        payType: exchangeConf.payType,
        // 道具类型，1记牌器，2求签卡，3洗牌卡，4祈福卡，5局内表情，6局内道具
        propType: exchangeConf.propType,
        // 子类型，祈福子类型，1财神卡，2关公卡，3老君卡，4招财猫卡
        childType: exchangeConf.childType,
        times: message.number === -1 ? -1 : (exchangeConf.payType === 1 ? (new Date().getTime() + 1000 * 60 * 60 * 24 * message.number) : -1),
        number: exchangeConf.payType === 2 ? message.number : 0
      }

      await PlayerProp.create(data);
    }

    // 如果用户已经拥有道具，则在过期时间加上有效时间
    if (playerProp && playerProp.payType === 1) {
      await PlayerProp.update({playerId: model._id, propId: exchangeConf.propId}, {$set: {times: message.number !== -1 ? (playerProp.times + 1000 * 60 * 60 * 24 * message.number) : -1}})
    }

    // 如果用户已经拥有道具，则增加数量
    if (playerProp && playerProp.payType === 2) {
      await PlayerProp.update({playerId: model._id, propId: exchangeConf.propId}, {$set: {number: message.number + playerProp.number}});
    }

    // 扣除钻石
    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -price}});
    this.player.model.diamond = model.diamond - price;
    // 增加日志
    await service.playerService.logGemConsume(model._id, ConsumeLogType.payProp, -price, this.player.model.diamond, `购买道具`, exchangeConf._id);

    this.replySuccess({price, number: message.number, propId: exchangeConf.propId});
    await this.player.updateResource2Client();
  }
}
