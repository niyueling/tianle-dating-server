'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    // 概率
    probability: {
        type: Number,
        required: true
    },
    // 奖品数量
    num: {
        type: Number,
        required: true
    },
    // 奖品实际数量
    residueNum: {
        type: Number,
        required: true
    },
    // 类型, 1钻石，2金豆
    type: {
        type: Number,
        required: true
    },
    // 创建时间
    createAt: {
        type: Date,
        required: true,
        default: Date.now
    },
});

const TurntablePrize = mongoose.model('TurntablePrize', schema);
export default TurntablePrize;
