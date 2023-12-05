'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockUserSchema = new Schema({
  openid: {type: String, required: true},
  shortId: {type: Number, required: true},
  avatar: {type: String, required: true},
  nickname: {type: String, required: true},
  gem: {type: Number, default: 0}, // 钻石
  gold: {type: Number, default: 0}, // 金币
  curLevel: {type: Number, default: 1}, // 关卡
  slotNum: {type: Number, default: 1}, // 英雄槽
  power: {type: Number, default: 10}, // 体力
  redPocket: {type: Number, default: 0}, // 红包
  shopGiftLevel: {type: Number, default: 1}, // 商城礼包等级
  shopGiftEmpirical: {type: Number, default: 0}, // 商城礼包经验
  activityTimes: {type: Number, default: 0}, // 在线时长
  turntableTimes: {type: Number, default: 10}, // 转盘次数
  consecutiveLoginDays: {type: Number, default: 1}, // 连续登陆天数
  sessionKey: {type: String},
  updateTime: {type: Number},
  guideSteps: {type: Number, default: 1001},
  hammerCount: {type: Number, required: true, default: 1},
  createAt: {type: Date, default: Date.now},
  location: {type: Number, required: true, default: 1},
  ip: {type: String},
  province: {type: String},
  city: {type: String},
  robot: {type: Boolean, default: false}
});

BlockUserSchema.index({openid: 1});
BlockUserSchema.index({shortId: 1});

const BlockUser = mongoose.model('BlockUser', BlockUserSchema);

export default BlockUser
