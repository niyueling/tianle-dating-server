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
  freeAdverCount: {
    type: Number,
    required: true
  },
  gold: {
    type: Number,
    required: true
  },
  // 创建时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const PlayerFreeGoldRecord = mongoose.model('PlayerFreeGoldRecord', schema);
export default PlayerFreeGoldRecord
