'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//每日补充包
const DailySupplementGiftSchema = new Schema({
  name: {type: String},//名称
  level: {type: Number, required: true},//等级
  payPrize: {type: Object, default: {}},//购买后奖励
  dailyPrize: {type: Object, default: {}},//每日奖励
  price: {type: Number, required: true},// 价格
  originPrice: {type: Number, required: true},// 原价
  dailyReceiveCount: {type: Number, required: true},//每日领取次数
  currency: {type: String, required: true},//币种
  createAt: {type: Date, default: Date.now}
});

DailySupplementGiftSchema.index({level: 1});

const DailySupplementGift = mongoose.model('DailySupplementGift', DailySupplementGiftSchema);

export default DailySupplementGift
