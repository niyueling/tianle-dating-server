'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MonthGiftSchema = new Schema({
  name: {type: String},//名称
  dayList: {type: Array, default: []},//几天卡
  prizeList: {type: Array, default: []},//奖励
  createAt: {type: Date, default: Date.now}
});

MonthGiftSchema.index({day: 1});

const MonthGift = mongoose.model('MonthGift', MonthGiftSchema);

export default MonthGift
