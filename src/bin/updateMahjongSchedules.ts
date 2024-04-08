import {RedisKey} from "@fm/common/constants";
import {service} from "../service/importService";
import Player from "../database/models/player";

async function updateTurntableTimes() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateBlockTurntableTimesLock, 3600);
  if (!lock) {
    // 有进程在处理
    console.log('anther processing')
    return;
  }

  const users = await Player.find();
  if (users.length > 0) {
    console.log('update turntable times', new Date().toLocaleString());
  }

  for (const user of users) {
    user.turntableTimes = 10;
    user.freeAdverCount = 10;
    user.helpCount = 5;

    if (user.giftExpireTime && user.giftExpireTime > new Date().getTime()) {
      user.turntableTimes += 10;
    }

    await user.save();
  }
  return lock.unlock();
}

async function updateRobotGameState() {
  const users = await Player.find({isGame: true});
  if (users.length > 0) {
    console.log('update robot game state', new Date().toLocaleString());
  }

  for (const user of users) {
    if (user.gameTime && new Date().getTime() > Date.parse(user.gameTime) + 1000 * 60 * 3) {
      user.isGame = false;
      await user.save();
    }
  }
}

module.exports = {
  updateTurntableTimes,
  updateRobotGameState
}
