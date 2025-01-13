'use strict';

// 7日狂欢任务记录
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  // 任务类型
  taskType: {
    type: Number,
    required: true,
  },
  // 奖励
  prize: {
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

const RedPocketDebrisRecord = mongoose.model('RedPocketDebrisRecord', schema);
export default RedPocketDebrisRecord;
