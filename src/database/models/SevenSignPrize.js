'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SevenSignPrizeSchema = new Schema({
  type: {type: Number, default: 0},//1奖励钻石,2奖励金豆
  number: {type: Number, default: 0},//奖励数量
  day: {type: Number},//第几天奖励
  createAt: {type: Date, default: Date.now}
});

SevenSignPrizeSchema.index({type: 1});

const SevenSignPrize = mongoose.model('SevenSignPrize', SevenSignPrizeSchema);

export default SevenSignPrize
