'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
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
  vip: {
    type: Number,
    required: false,
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
});

const PlayerVipUpgradeRecord = mongoose.model('PlayerVipUpgradeRecord', schema);
export default PlayerVipUpgradeRecord;
