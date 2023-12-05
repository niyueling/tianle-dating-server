'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockTaskTotalPrizeSchema = new Schema({
  name: {type: String, required: true},//奖励名称
  type: {type: Number, required: true},//奖励类型，0金币，1钻石，2体力，3碎片
  number: {type: Number, default: 0},//奖励数量
  level: {type: Number, default: 1},//品质
  propId: {type: Number},//物品ID
  liveness: {type: Number, default: 0},//活跃度
  createAt: {type: Date, default: Date.now}
});

BlockTaskTotalPrizeSchema.index({name: 1});
BlockTaskTotalPrizeSchema.index({type: 1});

const BlockTaskTotalPrize = mongoose.model('BlockTaskTotalPrize', BlockTaskTotalPrizeSchema);

export default BlockTaskTotalPrize
