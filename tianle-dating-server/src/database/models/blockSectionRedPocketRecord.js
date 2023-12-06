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
  redPocket: {
    type: Number,
    required: true
  },
  mapId: {
    type: Number,
    default: 0
  },
  curLevel: {
    type: String
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockSectionRedPocketRecord = mongoose.model('BlockSectionRedPocketRecord', schema);
export default BlockSectionRedPocketRecord;
