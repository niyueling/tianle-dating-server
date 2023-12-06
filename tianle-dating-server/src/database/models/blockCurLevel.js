'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockCurLevelSchema = new Schema({
  mapId: {type: Number, required: true},//关卡ID
  number: {type: String, required: true},//关卡数
  cashs: {type: Array, default: []},//红包金额
  createAt: {type: Date, default: Date.now}
});

const BlockCurLevel = mongoose.model('BlockCurLevel', BlockCurLevelSchema);

export default BlockCurLevel;
