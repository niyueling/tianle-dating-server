'use strict';

// 玩家属性
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
  // 属性名
  name: {
    type: String,
    required: true
  },
  // 属性类型
  attrType: {
    type: Number,
    required: true
  },
  // 属性值
  value: {
    type: String,
    required: true
  },
});

const PlayerAttr = mongoose.model('PlayerAttr', schema);
export default PlayerAttr;
