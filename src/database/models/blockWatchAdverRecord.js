'use strict';

// 广告打点
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
  adId: {
    type: String
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockWatchAdverRecord = mongoose.model('BlockWatchAdverRecord', schema);
export default BlockWatchAdverRecord;
