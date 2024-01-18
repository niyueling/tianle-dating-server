'use strict';

// 7日狂欢任务记录
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
  // lottery prize 奖品 id
  prizeId: {
    type: mongoose.Schema.ObjectId,
    required: false,
  },
  // 是否中奖
  isHit: {
    type: Boolean,
    required: true,
  },
  // 奖品配置
  prizeConfig: {
    type: Object,
    required: false,
  },
});

const TurntablePrizeRecord = mongoose.model('TurntablePrizeRecord', schema);
export default TurntablePrizeRecord;
