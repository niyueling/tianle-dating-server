/**
 * Created by comet on 16/10/15.
 */
import GlobalModel from './models/global';
import Club from "./models/club";

// 用户 id 从7位数开始
export function initPlayerShortId() {
  return GlobalModel.findOrCreate({ _id: 'player', shortIdCounter: 1000000 });
}

// 新用户 id
export async function getNewShortPlayerId() {
  const updater = {$inc: {shortIdCounter: 1}}
  const options = { new: true }
  const global = await GlobalModel.findOneAndUpdate({ _id: 'player' }, updater, options)
  return global.shortIdCounter;
}

// 方块用户 id
export async function getBlockNewShortUserId() {
  const updater = {$inc: {shortIdCounter: 1}}
  const options = { new: true }
  const global = await GlobalModel.findOneAndUpdate({ _id: 'block' }, updater, options)
  return global.shortIdCounter;
}

// 初始化战队 id
export function initClubShortId() {
  return GlobalModel.findOrCreate({ _id: 'club', shortIdCounter: 100000 });
}

// 初始化邀请码
export function initPlayerInviteCode() {
  return GlobalModel.findOrCreate({ _id: 'playerInviteCode', shortIdCounter: 100000 });
}

// 获取新战队 id
export async function getNewShortClubId() {
  const updater = {$inc: {shortIdCounter: 1}}
  const options = { new: true }
  const global = await GlobalModel.findOneAndUpdate({ _id: 'club' }, updater, options)
  // 检查 id 是否存在
  const club = await Club.findOne({
    shortId: global.shortIdCounter,
  })
  if (club) {
    // id 存在, 重新取一个
    return getNewShortClubId();
  }
  return global.shortIdCounter;
}

export async function getNewPlayerInviteCode() {
  const updater = {$inc: {shortIdCounter: 1}}
  const options = { new: true }
  const global = await GlobalModel.findOneAndUpdate({ _id: 'playerInviteCode' }, updater, options)
  return global.shortIdCounter;
}
