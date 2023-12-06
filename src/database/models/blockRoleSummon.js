'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // 召唤名称
  name: {
    type: String
  },
  //召唤类型，1普通召唤，2高级召唤
  summonType: {
    type: Number,
    required: true,
  },
  // 角色类型，1士兵，2英雄
  roleType: {
    type: Number,
    required: true,
  },
  // 免费召唤次数
  todayFreeCount: {
    type: Number,
    required: true,
    default: 1
  },
  // 召唤一次消耗钻石
  consumeAmountOne: {
    type: Number,
    required: true,
    default: 0
  },
  // 召唤10次消耗钻石
  consumeAmountTen: {
    type: Number,
    required: true,
    default: 0
  },
  // 冷却时间
  coolingTime: {
    type: Number,
    required: true,
    default: 0
  },
  // 消耗币种，1使用金币，2使用钻石
  currencyType: {
    type: Number,
    required: true,
    default: 1
  },
  // 累计召唤次数，召唤更高级英雄
  summonHignCount: {
    type: Number,
    required: true,
    default: 30
  },
  summonHignLevel: {
    type: String,
    required: true,
    default: "N"
  },
  // 召唤等级
  summonLevel: {
    type: Array,
    required: true
  },
  isHignOpportunity: {
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

const BlockRoleSummon = mongoose.model('BlockRoleSummon', schema);
export default BlockRoleSummon
