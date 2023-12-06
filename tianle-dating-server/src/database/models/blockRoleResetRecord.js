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
  // 角色配置
  roleConfig: {
    type: Object,
    required: true,
  },
  // 角色信息
  roleInfo: {
    type: Object,
    required: true,
  },
  // 累计消耗金币
  consumeGold: {
    type: Number,
    required: true,
    default: 0
  },
  // 当前角色等级
  roleLevel: {
    type: Number,
    required: true,
    default: 0
  },
  // 返回金币
  resetGold: {
    type: Number,
    required: true,
    default: 0
  },
  // 需要花费钻石
  consumeDiamond: {
    type: Number,
    required: true,
    default: 0
  },
  // 是否看视频领取
  isFree: {
    type: Boolean,
    required: true,
    default: false
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockRoleResetRecord = mongoose.model('BlockRoleResetRecord', schema);
export default BlockRoleResetRecord
