'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VipConfigSchema = new Schema({
  experience: {type: Number},//经验
  vip: {type: Number},//vip等级
  prizeList: {type: Array, default: []},//奖励
  noteList: {type: Array, default: []},//奖励说明
  createAt: {type: Date, default: Date.now}
});

const VipConfig = mongoose.model('VipConfig', VipConfigSchema);

export default VipConfig
