'use strict';

// 7日狂欢任务记录
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  // 任务类型
  taskId: {
    type: Number,
    required: true,
  },
  // 成就点
  liveness: {
    type: Number,
    required: true,
    default: 0
  },
  // 任务配置
  taskConfig: {
    type: Object,
    required: true,
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const RegressionTaskRecord = mongoose.model('RegressionTaskRecord', schema);
export default RegressionTaskRecord;
