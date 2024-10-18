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
  prizeId: {
    type: mongoose.Schema.ObjectId,
    required: false,
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const DailySupplementReceiveRecord = mongoose.model('DailySupplementReceiveRecord', schema);
export default DailySupplementReceiveRecord
