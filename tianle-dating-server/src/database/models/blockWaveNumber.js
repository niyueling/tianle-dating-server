'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockWaveNumberSchema = new Schema({
  waveId: {type: Number, required: true},//波数ID
  name: {type: String, required: true},//波数名称
  enemyId: {type: Array, default: {}},//怪列表
  enemyLv: {type: Array, default: {}},//怪等级
  timeGap: {type: Number, default: 1.2},//碎片ID
  prizeLists: {type: Array, required: true},//奖励列表
  createAt: {type: Date, default: Date.now}
});

BlockWaveNumberSchema.index({name: 1});
BlockWaveNumberSchema.index({type: 1});

const BlockWaveNumber = mongoose.model('BlockWaveNumber', BlockWaveNumberSchema);

export default BlockWaveNumber;
