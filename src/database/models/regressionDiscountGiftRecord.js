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

const RegressionDiscountGiftRecord = mongoose.model('RegressionDiscountGiftRecord', schema);
export default RegressionDiscountGiftRecord
