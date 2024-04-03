'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskTotalPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型
  number: {type: Number, default: 0},//奖励数量
  propId: {type: Number},//物品ID
  liveness: {type: Number, default: 0},//活跃度
  createAt: {type: Date, default: Date.now}
});

TaskTotalPrizeSchema.index({type: 1});

const DebrisTotalPrize = mongoose.model('DebrisTotalPrize', TaskTotalPrizeSchema);

export default DebrisTotalPrize
