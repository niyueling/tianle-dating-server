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
  config: {
    type: Object,
    default: {}
  },
  configId: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    required: true,
    default: false
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockRedPocketWithdrawRecord = mongoose.model('BlockRedPocketWithdrawRecord', schema);
export default BlockRedPocketWithdrawRecord;
