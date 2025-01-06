'use strict';

const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
    },
    // 支付状态
    status: {
        type: Number,
        required: true,
        default: 0
    },
    sn: {
        type: String,
        required: true
    },
    transactionId: {
        type: String
    },
    // 创建时间
    createAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const RegressionRechargeRecord = mongoose.model('RegressionRechargeRecord', schema);
export default RegressionRechargeRecord
