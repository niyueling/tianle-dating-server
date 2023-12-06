'use strict';

const mongoose = require('mongoose');

// 金豆房配置表
const schema = new mongoose.Schema({
  // title
  title: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  // 房间类型， gold = 金豆
  category: {
    type: String,
    required: true,
  },
  // 倍率
  minScore: {
    type: Number,
    required: true,
  },
  // 最少金豆数
  minAmount: {
    type: Number,
    required: true,
  },
  // 最大金豆数
  maxAmount: {
    type: Number,
    required: true,
  },
  // 上线人数
  playerCount: {
    type: Number,
    required: true,
  },
  // 进房扣金豆
  roomRate: {
    type: Number,
    required: true,
  },
  // 类别
  gameCategory: {
    type: String,
    required: true,
  },
  // 是否上架
  isOpen: {
    type: Boolean,
    required: true,
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
  },
  // 是否允许翻倍
  isOpenDouble: {
    type: Boolean,
    required: true
  }
})

const GameCategory = mongoose.model('GameCategory', schema);
module.exports = {
  GameCategory,
}
