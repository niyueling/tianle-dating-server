import GoodsModel from "../../database/models/goods";
import GoodsExchangeRuby from "../../database/models/goodsExchangeRuby";
import {addApi, BaseApi} from "./baseApi";
import {ConsumeLogType, TianleErrorCode} from "@fm/common/constants";
import UserRechargeOrder from "../../database/models/userRechargeOrder";
import PlayerModel from "../../database/models/player";
import crypto = require('crypto');
import {service} from "../../service/importService";
import FreeGoldRecord from "../../database/models/freeGoldRecord";
import * as moment from "moment";

// 商品
export class GoodsApi extends BaseApi {
  // 所有商品列表
  @addApi()
  async getGoodsList() {
    const goodsList = await GoodsModel.find({ isOnline: true }).sort({price: 1});
    const rubyList = await GoodsExchangeRuby.find().sort({diamond: 1});
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    let goldList = [];
    for (let i = 0; i < rubyList.length; i++) {
      let params = {
        _id: rubyList[i]._id,
        diamond: rubyList[i].diamond,
        gold: rubyList[i].gold,
        receive: false
      }
      if (rubyList[i].diamond === 0) {
        // 判断今日是否领取
        const count = await FreeGoldRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});
        params.receive = !!count;
      }

      goldList.push(params);
    }

    this.replySuccess({ goodsList, rubyList: goldList });
  }

  // 钻石兑换金豆
  @addApi()
  async diamond2gold(message) {
    const exchangeConf = await GoodsExchangeRuby.findById(message._id);
    if (!exchangeConf) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }
    const gem2ExchangeNum = exchangeConf.diamond;
    const model = await service.playerService.getPlayerModel(this.player.model._id);
    const gold = exchangeConf.gold
    if (gem2ExchangeNum > model.diamond && gem2ExchangeNum > 0) {
      return this.replyFail(TianleErrorCode.diamondInsufficient);
    }

    await PlayerModel.update({_id: model._id}, {$inc: {diamond: -gem2ExchangeNum, gold}});
    this.player.model.gem = model.diamond - gem2ExchangeNum;
    this.player.model.gold = model.gold + gold;
    let temp = '';
    if (gold > 100000000) {
      temp = (gold / 100000000) + "亿";
    } else if (gold > 1000000000000) {
      temp = (gold / 1000000000000) + "兆";
    }
    // 增加日志
    await service.playerService.logGemConsume(model._id, ConsumeLogType.gemForRuby, -gem2ExchangeNum, this.player.model.diamond, `成功兑换${gem2ExchangeNum}钻石成${temp}金豆`);

    this.replySuccess({diamond: gem2ExchangeNum, gold, goldFormat: temp});
    await this.player.updateResource2Client();
  }

  // 安卓虚拟支付
  @addApi()
  async wxGameRecharge(message) {
    const template = await GoodsModel.findOne({ isOnline: true, _id: message._id }).lean();
    if (!template) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    //判断用户是否充值过该模板
    const orderCount = await UserRechargeOrder.count({playerId: message.userId, status: 1, goodsId: message._id });
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
      diamond: template.amount,
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
    if (response.data.errcode !== 0) {
      console.warn(response);
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

    // 判断今日是否领取
    const count = await FreeGoldRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});
    if (count > 0) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    const goodInfo = await GoodsExchangeRuby.findOne({diamond: 0}).lean();
    if (!goodInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    let user = await this.service.playerService.getPlayerModel(this.player.model._id);
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    user.gold += goodInfo.gold;
    user.save();

    // 记录日志
    const record = await FreeGoldRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      gold: goodInfo.gold,
      config: goodInfo
    });

    return this.replySuccess(record);
  }
}
