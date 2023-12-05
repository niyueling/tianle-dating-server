import {RedisKey} from "@fm/common/constants";
import BlockUser from "../database/models/blockUser";
import {service} from "../service/importService";

// 更新方块战争转盘抽奖次数
async function updateBlockTurntableTimes() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateBlockTurntableTimesLock, 3600);
  if (!lock) {
    // 有进程在处理
    console.log('anther processing')
    return;
  }

  const users = await BlockUser.find();
  if (users.length > 0) {
    console.log('update block turntable times', new Date().toLocaleString());
  }

  for (const user of users) {
    user.turntableTimes = 10;
    user.hammerCount = 1;
    await user.save();
  }
  return lock.unlock();
}

// 更新方块战争用户体力
async function updateBlockUserPower() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateBlockUserPowerLock, 30);
  if (!lock) {
    // 有进程在处理
    console.log('anther processing')
    return;
  }

  const users = await BlockUser.find();
  const times = new Date().getTime();

  for (const user of users) {
    if ((user.updateTime && times - user.updateTime < 850000) || user.power >= 10) {
      continue;
    }

    user.power += 1;
    user.updateTime = times;
    await user.save();
  }

  return lock.unlock();
}

// 更新方块战争机器人关卡排行
async function updateBlockRobotCurLevelRanking() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateBlockRobotCurLevelLock, 3600);
  if (!lock) {
    // 有进程在处理
    console.log('anther processing')
    return;
  }

  const userCount = Math.floor(Math.random() * 7 - 3 + 1) + 3;
  const addCurLevel = Math.floor(Math.random() * 3) + 1;
  const users = await BlockUser.find({robot: true, curLevel: {$lte: 50}});
  let index = 0;

  for (const user of users) {
    const flag = Math.random();
    if (flag < 0.4 && index < userCount) {
      user.curLevel += addCurLevel;
      index++;
      await user.save();
    }
  }

  return lock.unlock();
}

module.exports = {
  updateBlockTurntableTimes,
  updateBlockUserPower,
  updateBlockRobotCurLevelRanking
}
