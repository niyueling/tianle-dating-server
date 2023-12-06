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
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockPassSectionRecord = mongoose.model('BlockPassSectionRecord', schema);
export default BlockPassSectionRecord;
