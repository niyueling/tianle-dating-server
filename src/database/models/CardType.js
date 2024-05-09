'use strict'
const mongoose = require('mongoose');

const CardTypeSchema = new mongoose.Schema({
  //牌型名称
  cardName: {
    type: String,
    required: true
  },
  //牌型ID
  cardId: {
    type: Number,
    required: true
  },
  //牌型倍数
  multiple: {
    type: Number,
    required: true
  },
  // 游戏类型
  gameType: {
    type: String,
    required: true
  },
  createAt: {type: Date, default: Date.now},
})

const CardType = mongoose.model('CardType', CardTypeSchema);

export default CardType;
