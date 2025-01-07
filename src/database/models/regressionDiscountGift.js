'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: {type: String},//名称
  price: {type: Number},//支付金额
  limitCount: {type: Number},// 限购次数
  prizeList: {type: Array, default: []},//奖励
  createAt: {type: Date, default: Date.now}
});

schema.index({price: 1});

const RegressionDiscountGift = mongoose.model('RegressionDiscountGift', schema);

export default RegressionDiscountGift
