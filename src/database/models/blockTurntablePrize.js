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
    // 类型, 1体力，2金币，3钻石，4碎片
    type: {
        type: Number,
        required: true
    },
    // 物品 id
    propId: {
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

const BlockTurntablePrize = mongoose.model('BlockTurntablePrize', schema);
export default BlockTurntablePrize;
