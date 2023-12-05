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
  multiple: {
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
  // lottery prize 奖品 id
  prizeId: {
    type: mongoose.Schema.ObjectId,
    required: false,
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
});

const BlockDailySignPrizeRecord = mongoose.model('BlockDailySignPrizeRecord', schema);
export default BlockDailySignPrizeRecord
