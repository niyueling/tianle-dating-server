'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  day: {
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
  isRegression: {
    type: Boolean,
    required: true,
    default: false
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
});

const MonthGiftRecord = mongoose.model('MonthGiftRecord', schema);
export default MonthGiftRecord
