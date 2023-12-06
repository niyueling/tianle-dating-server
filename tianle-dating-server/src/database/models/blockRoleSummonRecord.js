'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  shortId: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    required: true
  },
  //召唤ID
  summonId: {
    type: String,
    required: true,
  },
  // 是否高级召唤
  isHignOpportunity: {
    type: Boolean,
    required: true,
    default: false
  },
  // 碎片数量
  debrisCount: {
    type: Number,
    required: true,
    default: 0
  },
  // 召唤配置
  summonConfig: {
    type: Object,
    required: true,
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockRoleSummonRecord = mongoose.model('BlockRoleSummonRecord', schema);
export default BlockRoleSummonRecord
