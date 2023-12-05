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
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  prizeId: {
    type: mongoose.Schema.ObjectId,
    required: false,
  },
  multiple: {
    type: Number,
    required: true,
    default: 1
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
});

const BlockSevenSignPrizeRecord = mongoose.model('BlockSevenSignPrizeRecord', schema);
export default BlockSevenSignPrizeRecord
