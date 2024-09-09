import TurntablePrize from "../database/models/turntablePrize";
import {service} from "../service/importService";
import TurntablePrizeRecord from "../database/models/turntablePrizeRecord";

async function drawTurntable() {

}

// 每日活跃抽奖
async function draw(player) {

  const list = await TurntablePrize.find({
    // 忽略空奖励
    probability: {
      $gt: 0,
    },
    // 实际数量大于 0
    residueNum: {
      $gt: 0,
    },
  });

  const hitPrize = await service.lottery.randomWithNoPrize(list);
  // 抽奖记录
  const record = await this.recordLottery(player._id.toString(), player.shortId,
    hitPrize && hitPrize._id || null);
  return { isOk: true, times: player.turntableTimes, record };
}

// 记录抽奖记录
async function recordLottery(playerId, shortId, prizeId) {
  // 是否中奖
  const isHit = !!prizeId;
  let conf;
  if (prizeId) {
    conf = await this.getPrize(prizeId);
    if (!conf) {
      // 没有奖品配置
      console.error('no lottery prize', prizeId, playerId, shortId);
      return null;
    }
  }

  return await TurntablePrizeRecord.create({
    playerId,
    shortId,
    prizeConfig: conf || null,
    prizeId: conf && conf._id || null,
    createAt: new Date(),
    isHit,
  });
}

// 检查奖品是否存在
async function getPrize(prizeId) {
  return await TurntablePrize.findById(prizeId);
}

drawTurntable();
