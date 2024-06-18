'use strict';
const mongoose = require('mongoose');

// 钻石兑换币种
const schema = new mongoose.Schema({
  // 钻石数量
  diamond: {
    type: Number,
    required: true,
  },
  // 兑换的币种数量
  number: {
    type: Number,
    required: true,
  },
  // 币种
  currency: {
    type: String,
    required: true,
  },
})

const GoodsExchangeCurrency = mongoose.model('GoodsExchangeCurrency', schema);
export default GoodsExchangeCurrency;
