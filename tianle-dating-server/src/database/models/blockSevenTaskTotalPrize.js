'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockSevenTaskTotalPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型，1钻石，2金币，3碎片
  number: {type: Number, default: 0},//奖励数量
  level: {type: Number, default: 1},//品质
  propId: {type: Number},//碎片ID
  liveness: {type: Number, default: 0},//活跃度
  createAt: {type: Date, default: Date.now}
});

BlockSevenTaskTotalPrizeSchema.index({name: 1});
BlockSevenTaskTotalPrizeSchema.index({type: 1});

const BlockSevenTaskTotalPrize = mongoose.model('BlockSevenTaskTotalPrize', BlockSevenTaskTotalPrizeSchema);

export default BlockSevenTaskTotalPrize
