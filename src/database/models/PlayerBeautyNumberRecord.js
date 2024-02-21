'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },

  oldShortId: {
    type: Number,
    required: true
  },

  // ID
  newShortId: {
    type: Number,
    required: true
  },

  // 价格
  price: {
    type: Number,
    required: true
  },

  // 币种
  currency: {
    type: String,
    required: true
  },

  // 更新时间
  createAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

schema.index({numberId: 1});
schema.index({playerId: 1});

const GoodsBeautyNumberRecord = mongoose.model('GoodsBeautyNumberRecord', schema);

export default GoodsBeautyNumberRecord
