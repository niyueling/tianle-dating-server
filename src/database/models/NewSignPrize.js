'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewSignPrizeSchema = new Schema({
  name: {type: String},//名称
  day: {type: Number},//第几天奖励
  prizeList: {type: Array, default: 0},//奖励
  createAt: {type: Date, default: Date.now}
});

NewSignPrizeSchema.index({day: 1});

const NewSignPrize = mongoose.model('NewSignPrize', NewSignPrizeSchema);

export default NewSignPrize
