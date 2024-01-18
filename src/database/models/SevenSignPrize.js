'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SevenSignPrizeSchema = new Schema({
  diamond: {type: Number, default: 0},//奖励钻石
  gold: {type: Number, default: 0},//奖励金豆
  day: {type: Number},//第几天奖励
  createAt: {type: Date, default: Date.now}
});

SevenSignPrizeSchema.index({type: 1});

const SevenSignPrize = mongoose.model('SevenSignPrize', SevenSignPrizeSchema);

export default SevenSignPrize
