'use strict';

// 闯关记录
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
  curLevel: {
    type: Number,
    required: true
  },
  // 消除方块数
  blockCount: {
    type: Number,
    default: 0
  },
  // 消除敌人数
  enemyCount: {
    type: Number,
    default: 0
  },
  success: {
    type: Boolean,
    default: false
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockSectionDetailRecord = mongoose.model('BlockSectionDetailRecord', schema);
export default BlockSectionDetailRecord;
