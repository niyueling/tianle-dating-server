'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewFirstRechargeSchema = new Schema({
  day: {type: Number},//第几天奖励
  prizeList: {type: Array, default: 0},//奖励
  createAt: {type: Date, default: Date.now}
});

NewFirstRechargeSchema.index({day: 1});

const NewFirstRecharge = mongoose.model('NewFirstRecharge', NewFirstRechargeSchema);

export default NewFirstRecharge
