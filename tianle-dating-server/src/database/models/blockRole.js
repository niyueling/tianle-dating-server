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
  // 角色ID
  roleId: {
    type: Number,
    required: true,
  },
  //角色等级
  level: {
    type: Number,
    required: true,
  },
  // 角色品质
  quality: {
    type: String,
    required: true,
    default: "N"
  },
  // 角色品质阶级
  qualityLevel: {
    type: Number,
    required: true,
    default: 0
  },
  // 角色品质星数
  qualityStar: {
    type: Number,
    required: true,
    default: 1
  },
  //角色类型，1士兵，2英雄
  type: {
    type: Number,
    required: true,
    default: 1
  },
  selected: {
    type: Number,
    default: 0
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

const BlockRole = mongoose.model('BlockRole', schema);
export default BlockRole
