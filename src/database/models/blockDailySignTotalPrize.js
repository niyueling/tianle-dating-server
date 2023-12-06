'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockDailySignTotalPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型，0金币，1钻石，2体力，3碎片
  number: {type: Number, default: 0},//奖励数量
  level: {type: Number, default: 1},//品质
  propId: {type: Number},//碎片ID
  liveness: {type: Number, default: 0},//活跃度
  createAt: {type: Date, default: Date.now}
});

blockDailySignTotalPrizeSchema.index({name: 1});
blockDailySignTotalPrizeSchema.index({type: 1});

const BlockDailySignTotalPrize = mongoose.model('BlockDailySignTotalPrize', blockDailySignTotalPrizeSchema);

export default BlockDailySignTotalPrize
