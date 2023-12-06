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
  // 道具ID
  propId: {
    type: Number,
    required: true,
  },
  //道具类型
  type: {
    type: Number,
    required: true,
  },
  //道具数量
  number: {
    type: Number,
    required: true,
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockBackPack = mongoose.model('BlockBackPack', schema);
export default BlockBackPack
