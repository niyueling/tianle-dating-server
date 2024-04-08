'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegressionSignPrizeSchema = new Schema({
  day: {type: Number},//第几天奖励
  freePrizeList: {type: Array, default: []},//免费奖励
  payPrizeList: {type: Array, default: []},//付费奖励
  createAt: {type: Date, default: Date.now}
});

RegressionSignPrizeSchema.index({day: 1});

const RegressionSignPrize = mongoose.model('RegressionSignPrize', RegressionSignPrizeSchema);

export default RegressionSignPrize
