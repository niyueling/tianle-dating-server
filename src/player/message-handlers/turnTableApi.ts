import {
  TurntablePrizeType,
  GlobalConfigKeys,
  RedisKey,
  TianleErrorCode, ConsumeLogType
} from "@fm/common/constants";
import * as moment from "moment/moment";
import {service} from "../../service/importService";
import {addApi, BaseApi} from "./baseApi";
import TurntablePrize from "../../database/models/turntablePrize";
import TurntablePrizeRecord from "../../database/models/turntablePrizeRecord";
import Player from "../../database/models/player";
import {pick} from "lodash/lodash";

export class TurnTableApi extends BaseApi {
  // 获取转盘列表
  @addApi()
  async getActiveGift() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const result = await TurntablePrize.find();
    const gifts = [];
    for (const conf of result) {
      gifts.push({
        prizeId: conf._id,
        probability: conf.probability,
        num: conf.num,
        type: conf.type
      })
    }

    const freeCount = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveFreeCount) || 0;
    const shareCount = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveShareCount) || 0;
    const count = await this.todayLotteryCount(user._id.toString(), user.shortId);

    this.replySuccess({
      prizeList: gifts,
      lotteryTimes: user.turntableTimes,
      freeCount: Number(freeCount),
      shareCount: Number(shareCount),
      count,
    });
  }

  // 转盘抽奖
  @addApi()
  async activeLottery() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const result = await this.draw(user)
    if (!result.isOk) {
      return this.replyFail(TianleErrorCode.drawFail);
    }

    this.replySuccess({
      // 中奖记录 id
      recordId: result.record._id,
      // 中奖 id
      prizeId: result.record.prizeId,
      // 是否中奖
      isHit: result.record.isHit,
      num: result.record.prizeConfig && result.record.prizeConfig.num,
      type: result.record.prizeConfig && result.record.prizeConfig.type,
      turntableTimes: result.times
    })
  }

  // 转盘抽奖1万次
  @addApi()
  async drawTurntable() {
    let results = [];
    let datas = {};

    const user = await this.service.playerService.getPlayerModel("66d8208f2e0262636dfec158");

    const result = await TurntablePrize.find();
    for (const conf of result) {
      results.push({
        prizeId: conf._id,
        probability: conf.probability,
        num: conf.num,
        type: conf.type
      })
    }

    // 抽奖一万次
    for (let i = 0; i < 10000; i++) {
      const draw = await this.draw(user);
      if (draw.isOk) {
        result.push({
          // 中奖记录 id
          recordId: draw.record._id,
          // 中奖 id
          prizeId: draw.record.prizeId,
          // 是否中奖
          isHit: draw.record.isHit,
          num: draw.record.prizeConfig && draw.record.prizeConfig.num,
          type: draw.record.prizeConfig && draw.record.prizeConfig.type,
          turntableTimes: draw.times
        });

        if (datas[draw.record._id]) {
          datas[draw.record._id].count++;
        } else {
          datas[draw.record._id] = {recordId: draw.record._id, num: draw.record.prizeConfig && draw.record.prizeConfig.num, type: draw.record.prizeConfig && draw.record.prizeConfig.type, count: 0};
        }
      }
    }

    this.replySuccess({result, datas});
  }

  // 领取奖品
  @addApi({
    rule: {
      // 奖品 id
      recordId: 'string'
    }
  })
  async receiveTurntableLotteryPrize(msg) {
    const resp = await this.receiveTurntablePrize(msg.recordId)
    if (!resp.isOk) {
      return this.replyFail(TianleErrorCode.receiveFail)
    }

    const user = await service.playerService.getPlayerModel(this.player._id);
    this.player.sendMessage('resource/update', {ok: true, data: pick(user, ['gold', 'diamond', 'tlGold'])});

    this.replySuccess({});
  }

  // 获取抽奖记录
  @addApi({
    rule: {
      openid: "string",
      // 上页最后一个 _id
      nextId: "string?",
      // 每页数量
      limit: "number?"
    }
  })
  async getTurntableLotteryRecord(message) {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    // 默认10页
    const limit = message.limit || 10;

    // 总数
    const count = await TurntablePrizeRecord.count({
      shortId: user.shortId,
    });

    let records;
    if (message.nextId) {
      records = await TurntablePrizeRecord.find({
        _id: {
          $lt: message.nextId,
        },
        shortId: user.shortId,
      }).limit(limit).sort({ _id: -1 })
    } else {
      records = await TurntablePrizeRecord.find({
        shortId: user.shortId,
      }).limit(limit).sort({ _id: -1 })
    }
    const resp = [];
    for (const r of records) {
      resp.push({
        _id: r._id,
        // 抽奖时间
        createAt: r.createAt,
        // 是否中奖
        isHit: r.isHit,
        // 中奖配置
        prizeConfig: r.prizeConfig && {
          prizeId: r.prizeConfig._id,
          num: r.prizeConfig.num,
          type: r.prizeConfig.type,
        } || null,
      })
    }
    this.replySuccess({ list: resp, count });
  }

  // 领奖
  async receiveTurntablePrize(recordId) {
    const lock = await service.utils.grantLockOnce(RedisKey.receiveLottery + recordId, 3);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }

    const record = await TurntablePrizeRecord.findById(recordId);
    if (!record || !record.isHit) {
      // 没有领奖记录 or 未中奖
      await lock.unlock();
      return { isOk: false };
    }

    const model = await this.service.playerService.getPlayerModel(record.playerId);

    switch (record.prizeConfig.type) {
      case TurntablePrizeType.diamond:
        await Player.update({_id: model._id }, {$inc: { diamond: record.prizeConfig.num }});
        await service.playerService.logGemConsume(model._id, ConsumeLogType.chargeByActive, record.prizeConfig.num,
          model.diamond + record.prizeConfig.num, `转盘抽中${record.prizeConfig.num}钻石`);
        break;

      case TurntablePrizeType.gold:
        await Player.update({_id: model._id }, {$inc: { gold: record.prizeConfig.num }});
        await service.playerService.logGoldConsume(model._id, ConsumeLogType.receiveDraw, record.prizeConfig.num,
          model.diamond + record.prizeConfig.num, `转盘抽奖获得`);
        break;
    }

    await record.save();
    await lock.unlock();

    return { isOk: true, model };
  }

  // 每日活跃抽奖
  async draw(player) {
    const lock = await service.utils.grantLockOnce(RedisKey.dailyLottery + player.shortId, 3);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }

    // 查找抽奖次数
    if (player.turntableTimes < 1) {
      // 没有抽奖次数了
      await lock.unlock();
      return { isOk: false };
    }

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

    const hitPrize = await this.service.lottery.randomWithNoPrize(list);
    // 抽奖记录
    const record = await this.recordLottery(player._id.toString(), player.shortId,
      hitPrize && hitPrize._id || null);
    // 抽奖次数减一
    player.turntableTimes --;
    await player.save();
    await lock.unlock();
    return { isOk: true, times: player.turntableTimes, record };
  }

  // 记录抽奖记录
  async recordLottery(playerId, shortId, prizeId) {
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
      // 实际数量-1
      conf.residueNum--;
      await conf.save();
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
  async getPrize(prizeId) {
    return await TurntablePrize.findById(prizeId);
  }

  // 今日抽奖次数
  async todayLotteryCount(playerId, shortId) {
    const start = moment().startOf('day').toDate()
    const end = moment().endOf('day').toDate()
    return TurntablePrizeRecord.count({
      playerId,
      shortId,
      createAt: {
        $gte: start,
        $lte: end,
      }
    })
  }
}
