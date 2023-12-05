'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockSevenSignPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型，1钻石，2金币，3碎片
  number: {type: Number, default: 0},//奖励数量
  propId: {type: Number},//碎片ID
  day: {type: Number},//第几天奖励
  createAt: {type: Date, default: Date.now}
});

BlockSevenSignPrizeSchema.index({type: 1});

const BlockSevenSignPrize = mongoose.model('BlockSevenSignPrize', BlockSevenSignPrizeSchema);

export default BlockSevenSignPrize
