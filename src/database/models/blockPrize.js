'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockPrizeSchema = new Schema({
  type: {type: Number, required: true},//奖励类型，1钻石，2金币，3碎片,4体力
  number: {type: Number, default: 0},//奖励数量
  level: {type: Number, default: 1},//品质
  roleId: {type: Number},//角色ID
  propId: {type: Number},//碎片ID
  times: {type: Number, default: 0},//在线时间
  createAt: {type: Date, default: Date.now}
});

BlockPrizeSchema.index({type: 1});

const BlockPrize = mongoose.model('BlockPrize', BlockPrizeSchema);

export default BlockPrize
