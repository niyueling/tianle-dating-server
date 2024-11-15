'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // ID
  numberId: {
    type: String,
    required: true
  },

  // 价格
  price: {
    type: Number,
    required: true
  },

  // 原价
  originalPrice: {
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

const GoodsBeautyNumber = mongoose.model('GoodsBeautyNumber', schema);

export default GoodsBeautyNumber
