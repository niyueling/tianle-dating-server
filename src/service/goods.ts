import { ApplePrice, GoodsType, OrderType, PayMethod, PayStatus } from "@fm/common/constants"
import {Errors, GameError} from "@fm/common/errors";
import * as mongoose from 'mongoose'
import GoodsModel from "../database/models/goods";
import GoodsOrderModel from "../database/models/goodsOrder";
import GoodsPayOrderModel from "../database/models/goodsPayOrder";
import Player from "../database/models/player";
import BaseService from "./base";
import {service} from "./importService";

// 区域
export default class GoodsService extends BaseService {
  // 更新商品
  async updateGoods(id: mongoose.Types.ObjectId, goodsType: GoodsType, amount: number,
                    applePriceId: string, androidPrice: number, originPrice?: number,
                    isOnline?: boolean, firstTimeAmount?: number) {
    const m = await this.mustGetGoods(id);
    m.goodsType = goodsType;
    m.amount = amount;
    m.applePriceId = applePriceId;
    m.androidPrice = androidPrice;
    m.originPrice = originPrice || 0;
    m.isOnline = !!isOnline;
    m.firstTimeAmount = firstTimeAmount || 0;
    await m.save();
    return m;
  }

  // 添加商品
  async addGoods(goodsType: GoodsType, amount: number, applePriceId: string, androidPrice: number,
                 originPrice?: number, firstTimeAmount?: number) {
    const m = new GoodsModel({
      goodsType,
      amount,
      applePriceId,
      androidPrice,
      originPrice: originPrice || 0,
      isOnline: false,
      firstTimeAmount: firstTimeAmount || 0,
    });
    await m.save();
    return m;
  }

  // 删除商品
  async deleteGoods(id: mongoose.Types.ObjectId) {
    const m = await this.mustGetGoods(id);
    await m.remove();
  }

  async mustGetGoods(id: mongoose.Types.ObjectId) {
    const m = await GoodsModel.findById(id);
    if (!m) {
      throw new GameError(Errors.goodsNotExists);
    }
    return m;
  }

  async mustGetOrder(orderId) {
    const m = await GoodsOrderModel.findById(orderId);
    if (!m) {
      throw new GameError(Errors.goodsNotExists);
    }
    return m;
  }

  async createOrder(playerId, goodsId, orderType) {
    const goods = await this.mustGetGoods(goodsId);
    let price = goods.androidPrice;
    if (orderType === OrderType.apple) {
      if (!ApplePrice[goods.applePriceId]) {
        throw new GameError('支付配置错误')
      }
      // 转换成分
      price = Number(ApplePrice[goods.applePriceId]) * 100;
    }
    const record = new GoodsOrderModel({
      goodsDetail: goods,
      goodsId: goods._id,
      status: PayStatus.pending,
      playerId,
      orderType,
      payPrice: price,
      payMethod: PayMethod.pending,
    })
    await record.save();
    return record;
  }

  // 添加支付成功记录
  async recordPaySuccess(order, payMethod, thirdOrderNo, outOrderNo, isValid, appleReceiptData?) {
    const payOrder = new GoodsPayOrderModel({
      orderId: order._id,
      payPrice: order.payPrice,
      payMethod,
      status: PayStatus.success,
      thirdOrderNo,
      outOrderNo,
      isValid,
      appleReceiptData: appleReceiptData || '',
    })
    await payOrder.save();
    order.payMethod = payMethod;
    order.buyAt = new Date();
    order.status = PayStatus.success;
    await order.save();
    return payOrder;
  }

  // 根据第三方 order no 查找订单
  async getPayOrderByThirdOrderNo(thirdOrderNo) {
    return GoodsPayOrderModel.findOne({ thirdOrderNo });
  }

  // 是不是第一次购买
  async isFirstBuyGoods(playerId, goodsId) {
    const m = await GoodsOrderModel.count({
      playerId,
      goodsId,
      status: PayStatus.success,
    });
    return m === 1;
  }

  // 是否买过商品
  async hasBuyGoods(playerId, goodsId) {
    const m = await GoodsOrderModel.count({
      playerId,
      goodsId,
      status: PayStatus.success,
    });
    return m > 0;
  }

  // 购买成功
  async paySuccess(order) {
    const goods = await this.mustGetGoods(order.goodsId);
    const model = await Player.findById(order.playerId);
    let amount = goods.amount;
    const isOk = await this.isFirstBuyGoods(order.playerId, order.goodsId);
    if (isOk) {
      // 第一次买
      amount += goods.firstTimeAmount;
    }
    switch (goods.goodsType) {
      case GoodsType.card:
        // 添加房卡
        model.gem += amount;
        await model.save();
        break;
      default:
        this.logger.error('invalid goodsType', goods.goodsType);
        break;
    }
    // 邀请人收益
    await service.invite.addInviteeOrder(order.playerId, order._id, order.payPrice);
    // 返回添加的房卡
    return { gem: amount };
  }

  // 获取公众号支付的配置
  async getWechatGoodsPlans(playerId: string) {
    const list = await GoodsModel.find({ isOnline: true });
    const plans = [];
    for (const l of list) {
      let firstTimeAmount = l.firstTimeAmount;
      const isBuy = await this.hasBuyGoods(playerId, l._id);
      if (isBuy) {
        // 不是第一次买
        firstTimeAmount = 0;
      }
      plans.push({ gem: l.amount, price: l.androidPrice / 100, goodsId: l._id, firstTimeAmount })
    }
    return plans;
  }
}
