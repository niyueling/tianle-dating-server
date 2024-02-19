'use strict';

// 任务
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  player: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  residue: {
    type: Number,
    required: true
  },
  type: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    required: false
  },
  propId: {
    type: String
  },
  createAt: {type: Date, default: Date.now},
});

const DiamondRecord = mongoose.model('DiamondRecord', schema);
export default DiamondRecord;
