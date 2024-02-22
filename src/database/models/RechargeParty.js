'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RechargePartySchema = new Schema({
  price: {type: Number},//几元档
  day: {type: Number},//第几天奖励
  prizeList: {type: Array, default: 0},//奖励
  createAt: {type: Date, default: Date.now}
});

RechargePartySchema.index({day: 1});

const RechargeParty = mongoose.model('RechargeParty', RechargePartySchema);

export default RechargeParty
