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
  batchId: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  double: {
    type: Boolean,
    required: false,
    default: false,
  },
  waveId: {
    type: Number,
    required: false,
  },
  // 奖品配置
  waveConfig: {
    type: Object,
    required: false,
  },
});

const BlockWaveNumberRecord = mongoose.model('BlockWaveNumberRecord', schema);
export default BlockWaveNumberRecord
