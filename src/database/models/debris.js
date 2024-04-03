'use strict';

// 任务
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  //任务名称
  taskName: {
    type: String,
    required: true,
  },
  //任务描述
  taskDescribe: {
    type: String,
    required: true,
  },
  // 任务类型,1番型，2星座杠
  taskType: {
    type: Number,
    required: true,
  },
  // 任务ID
  taskId: {
    type: Number,
    required: true,
  },
  // 类型ID
  typeId: {
    type: Number,
    required: true,
  },
  // 任务次数
  taskTimes: {
    type: Number,
    required: false,
  },
  //任务奖励
  taskPrizes: {
    type: Object,
    required: true
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

const Debris = mongoose.model('debris', schema);
export default Debris;
