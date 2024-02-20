'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewDiscountGiftSchema = new Schema({
  name: {type: String},//名称
  price: {type: Number},//支付金额
  prizeList: {type: Array, default: []},//奖励
  createAt: {type: Date, default: Date.now}
});

NewDiscountGiftSchema.index({day: 1});

const NewDiscountGift = mongoose.model('NewDiscountGift', NewDiscountGiftSchema);

export default NewDiscountGift
