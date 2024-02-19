'use strict';

// 新手指引记录
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

const NewTaskRecord = mongoose.model('NewTaskRecord', schema);
export default NewTaskRecord;
