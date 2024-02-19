'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  propId: {
    type: Number,
    required: true
  },
  shortId: {
    type: Number,
    required: true
  },
  // 勋章类型
  medalType: {
    type: Number,
    required: true
  },
  // 勋章等级
  level: {
    type: Number,
    required: true
  },
  // 成就
  achievement: {
    type: Object,
    required: true
  },
  // 游戏类型
  gameType: {
    type: String,
    required: true
  },
  // 更新时间
  updateAt: {
    type: Date,
    required: true,
  },
});

NewSignPrizeSchema.index({day: 1});

const NewSignPrize = mongoose.model('NewSignPrize', NewSignPrizeSchema);

export default NewSignPrize
