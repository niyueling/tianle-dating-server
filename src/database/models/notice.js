'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoticeSchema = new Schema({
  type: {type: String, required: true},//类型，active活动公告,system系统公告，
  state: {type: Number, required: true},//状态，1正常，2删除
  title: {type: String, required: true},//公告标题
  content: {type: String, required: true},//公告内容
  createAt: {type: Date, required: true, default: Date.now},
});

NoticeSchema.index({createAt: -1});

const Notice = mongoose.model('Notice', NoticeSchema);

export default Notice;
