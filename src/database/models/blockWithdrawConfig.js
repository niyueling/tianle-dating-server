'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockWithdrawConfigSchema = new Schema({
  number: {type: Number, default: 0},//提现数量
  limitCount: {type: Number, default: 1},//限制提现次数
  signDay: {type: Number, default: 1},//需要签到天数
  watchCount: {type: Number, default: 0},//需要观看广告次数
  createAt: {type: Date, default: Date.now}
});

const BlockWithdrawConfig = mongoose.model('BlockWithdrawConfig', BlockWithdrawConfigSchema);

export default BlockWithdrawConfig
