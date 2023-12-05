'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockDailySignPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型，0金币，1钻石，2体力，3碎片
  number: {type: Number, default: 0},//奖励数量
  level: {type: Number, default: 1},//品质
  propId: {type: Number},//碎片ID
  day: {type: Number},//第几天
  createAt: {type: Date, default: Date.now}
});

BlockDailySignPrizeSchema.index({name: 1});
BlockDailySignPrizeSchema.index({type: 1});

const BlockDailySignPrize = mongoose.model('BlockDailySignPrize', BlockDailySignPrizeSchema);

export default BlockDailySignPrize;
