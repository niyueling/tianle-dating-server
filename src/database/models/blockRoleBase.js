'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // 碎片ID
  roleId: {
    type: Number,
    required: true,
  },
  // 角色ID
  baseId: {
    type: Number,
    required: true,
  },
  //升级需要碎片数量
  upgradeDebris: {
    type: Number,
    required: true,
  },
  // 角色品质
  quality: {
    type: String,
    required: true,
    default: "N"
  },
  //类型，1士兵，2英雄
  type: {
    type: Number,
    required: true,
  },
  //召唤权重
  weight: {
    type: Number,
    required: true,
    default: 0
  },
  //召唤碎片数量
  summonDebris: {
    type: Array,
    required: true,
    default: [1, 5]
  },
  //重置返还比例
  returnRadio: {
    type: Number,
    required: true,
    default: 0.8
  },
  //升级消耗基础值
  lvCost: {
    type: Number,
    required: true,
    default: 50
  },
  //升级消耗递增比例
  lvCostRate: {
    type: Number,
    required: true,
    default: 1
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const BlockRoleBase = mongoose.model('BlockRoleBase', schema);
export default BlockRoleBase
