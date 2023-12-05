'use strict';

// 提现记录
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
  redPocket: {
    type: Number,
    required: true
  },
  curLevel: {
    type: String
  },
  action: {
    type: Number,
    required: true,
    default: 1
  },
  type: {
    type: Number,
    required: true,
    default: 1
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockRedPocketRecord = mongoose.model('BlockRedPocketRecord', schema);
export default BlockRedPocketRecord;
