'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  prizeId: {
    type: mongoose.Schema.ObjectId,
    required: false,
  },
  day: {
    type: Number,
    required: true,
  },
  freeReceive: {
    type: Boolean,
    required: true,
  },
  payReceive: {
    type: Boolean,
    required: true,
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const RegressionSignPrizeRecord = mongoose.model('RegressionSignPrizeRecord', schema);
export default RegressionSignPrizeRecord
