'use strict';

// 7日狂欢任务
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // 任务类型
  taskType: {
    type: Number,
    required: true,
  },
  // 任务ID
  taskId: {
    type: Number,
    required: true,
  },
  // 任务次数
  taskTimes: {
    type: Number,
    required: false,
  },
  //第几天任务
  day: {
    type: Number,
    required: true,
  },
  //福利礼包，需要设置原价
  originalCost: {
    type: Number,
    default: 0
  },
  //福利礼包，需要设置现价
  currentCost: {
    type: Number,
    default: 0
  },
  //福利礼包，需要设置限购次数
  payCount: {
    type: Number,
    default: 0
  },
  //任务奖励
  prizeList: {
    type: Array,
    required: true
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

const BlockSevenTask = mongoose.model('BlockSevenTask', schema);
export default BlockSevenTask;
