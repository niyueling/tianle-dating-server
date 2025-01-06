'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    type: {type: Number, default: 1},//类型，1今日活跃宝箱，2累计活跃宝箱
    taskPrizes: {type: Array, required: true},
    liveness: {type: Number, default: 0},//活跃度
    createAt: {type: Date, default: Date.now}
});

schema.index({type: 1});

const RegressionTaskTotalPrize = mongoose.model('RegressionTaskTotalPrize', RegressionTaskTotalPrize);

export default RegressionTaskTotalPrize
