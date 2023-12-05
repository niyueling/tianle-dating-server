'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // 等级
  level: {
    type: Number,
    required: true,
    default: 1
  },
  // 经验值
  empirical: {
    type: Number,
    required: true,
    default: 0
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockShopGiftLevel = mongoose.model('BlockShopGiftLevel', schema);
export default BlockShopGiftLevel
