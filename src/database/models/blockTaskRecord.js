'use strict';

// 7日狂欢任务记录
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
  // 任务类型
  taskId: {
    type: Number,
    required: true,
  },
  // 任务类型
  liveness: {
    type: Number,
    required: true,
    default: 0
  },
  // 任是否双倍
  multiple: {
    type: Number,
    required: true,
    default: 1
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

const BlockTaskRecord = mongoose.model('BlockTaskRecord', schema);
export default BlockTaskRecord;
