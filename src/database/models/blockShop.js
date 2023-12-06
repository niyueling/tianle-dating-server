'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockShopSchema = new Schema({
  name: {type: String, required: true},//奖励名称
  type: {type: Number, required: true},//奖励类型，1：宝箱，2金币，3钻石，4体力
  amount: {type: Number, default: 0},//花费钻石
  prizeLists: {type: Array, required: true},//礼包内容
  todayCount: {type: Number, default: 0, required: true},//每日领取次数
  receiveCount: {type: Number, default: 0, required: true},//累计领取次数
  level: {type: Number, default: 1},//宝箱级别
  empirical: {type: Number, default: 0, required: true},//经验值
  giftType: {type: Number, default: 1},//礼包类型，1新手礼包，2普通礼包，3碎片礼包
  createAt: {type: Date, default: Date.now}
});

BlockShopSchema.index({name: 1});
BlockShopSchema.index({type: 1});

const BlockShop = mongoose.model('BlockShop', BlockShopSchema);

export default BlockShop
