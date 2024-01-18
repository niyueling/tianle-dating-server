import GoodsModel from "../../database/models/goods";
import GoodsExchangeRuby from "../../database/models/goodsExchangeRuby";
import {addApi, BaseApi} from "./baseApi";
import {TianleErrorCode} from "@fm/common/constants";
import UserRechargeOrder from "../../database/models/userRechargeOrder";
import PlayerModel from "../../database/models/player";
import crypto = require('crypto');

// 商品
export class GoodsApi extends BaseApi {
  // 所有商品列表
  @addApi()
  async getGoodsList() {
    const goodsList = await GoodsModel.find({ isOnline: true });
    const rubyList = await GoodsExchangeRuby.find();
    this.replySuccess({ goodsList, rubyList });
  }

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
      sn: this.service.utils.generateOrderNumber(),
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

    // 生成登录态签名和支付请求签名
    const signature = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(userPostBody)).digest('hex');
    const needSignMsg = "/wxa/game/getbalance&" + JSON.stringify(userPostBody);
    const paySign = crypto.createHmac('sha256', appKey).update(needSignMsg).digest('hex');
    // 查询用户游戏币余额
    const balanceUrl = `https://api.weixin.qq.com/wxa/game/getbalance?access_token=${accessToken}&signature=${signature}&sig_method=hmac_sha256&pay_sig=${paySign}`;
    const res = await this.service.base.curl(balanceUrl, { method: "post", data: userPostBody});
    const response = JSON.parse(res.data);
    if (response.errcode !== 0) {
      return this.replyFail(TianleErrorCode.payFail);
    }
    // 如果用户游戏币小于充值数量，通知客户端充值，operate=1
    if (response.balance < data.price * 10) {
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
}
