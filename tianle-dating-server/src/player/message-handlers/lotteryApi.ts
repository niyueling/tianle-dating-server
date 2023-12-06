import {GlobalConfigKeys} from "@fm/common/constants"
import LotteryPrize from "../../database/models/lotteryPrize";
import LotteryRecord from "../../database/models/lotteryRecord";
import RankConfig from "../../database/models/rankConfig";
import {service} from "../../service/importService";
import {addApi, BaseApi} from "./baseApi";

// 抽奖接口
export class LotteryApi extends BaseApi {
  // 根据 rank id 获取宝箱
  @addApi({
    rule: {rankId: 'string'},
  })
  async getGiftByRankId(message) {
    const rank = await RankConfig.findById(message.rankId);
    if (!rank) {
      return this.replyFail('无此排行榜');
    }
    const allBox = await this.service.lottery.findOrCreateRankBox(rank._id);
    const gifts = [];
    let conf;
    for (const box of allBox) {
      const record = {
        _id: box._id,
        boxNumber: box.boxNumber,
        isHit: box.isHit,
        isOpen: box.isOpen,
        name: null,
        price: null,
        quantity: null,
        source: null,
      };
      if (box.isHit) {
        // 中奖了
        conf = box.prizeId;
        // 奖品名
        record.name = conf.name;
        // 奖品价值
        record.price = conf.price;
        // 奖励数量
        record.quantity = conf.quantity;
        // 奖品类型，gem表示房卡，redpocket 表示红包，mobile 表示手机
        record.source = conf.source;
      }
      gifts.push(record);
    }
    const playerLottery = await this.service.lottery.getPlayerRankLotteryByPlayerId(this.player.model._id, rank._id);
    this.replySuccess({
      prizeList: gifts,
      lotteryTimes: playerLottery && playerLottery.times || 0,
    });
  }

  // 活跃奖宝箱
  @addApi()
  async getActiveGift() {
    const result = await LotteryPrize.find({
      type: 'player',
    });
    const gifts = [];
    for (const conf of result) {
      gifts.push({
        prizeId: conf._id,
        name: conf.name,
        price: conf.price,
        quantity: conf.quantity,
        source: conf.source,
      })
    }
    const playerLottery = await this.service.lottery.getOrCreatePlayerDailyLottery(this.player.model._id,
      this.player.model.shortId);
    const startAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.activeStartAt) || '0';
    const endAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.activeEndAt) || '0';
    const count = await service.lottery.todayLotteryCount(this.player.model._id, this.player.model.shortId);
    this.replySuccess({
      prizeList: gifts,
      lotteryTimes: playerLottery.times,
      startAt: new Date(parseInt(startAt, 10)),
      endAt: new Date(parseInt(endAt, 10)),
      count,
    });
  }

  // 活跃抽奖
  @addApi()
  async activeLottery() {
    let startAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.activeStartAt);
    let endAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.activeEndAt);
    if (!startAt || !endAt) {
      return this.replyFail('抽奖已下线')
    }
    startAt = new Date(parseInt(startAt, 10));
    endAt = new Date(parseInt(endAt, 10));
    const now = new Date().getTime();
    if (startAt.getTime() > now || endAt.getTime() < now) {
      // 时间到了
      return this.replyFail('抽奖已下线')
    }
    const result = await this.service.lottery.activeLottery(this.player.model._id)
    if (!result.isOk) {
      return this.replyFail('请稍后重试')
    }
    await this.player.updateResource2Client();
    this.replySuccess({
      // 中奖记录 id
      recordId: result.record._id,
      // 中奖 id
      prizeId: result.record.prizeId,
      // 是否中奖
      isHit: result.record.isHit,
      price: result.record.prizeConfig && result.record.prizeConfig.price,
      quantity: result.record.prizeConfig && result.record.prizeConfig.quantity,
      source: result.record.prizeConfig && result.record.prizeConfig.source,
      // // 中奖后的钻石，金豆
      // gem: result.model.gem,
      // ruby: result.model.ruby,
      // redPocket: result.model.redPocket,
    })
  }

  // 根据宝箱 id 排行榜抽奖
  @addApi({
    rule: {
      rankId: 'string',
      // 宝箱 id
      boxId: 'string',
    },
  })
  async rankLottery(message) {
    const result = await this.service.lottery.rankLottery(this.player.model._id, message.rankId, message.boxId);
    if (!result.isOk) {
      return this.replyFail('请稍后重试')
    }
    this.replySuccess({
      // 中奖 id
      prizeId: result.record.prizeId,
      // 是否中奖
      isHit: result.record.isHit,
      price: result.record.prizeConfig && result.record.prizeConfig.price,
      quantity: result.record.prizeConfig && result.record.prizeConfig.quantity,
      source: result.record.prizeConfig && result.record.prizeConfig.source,
    })
  }

  // 获取抽奖记录
  @addApi({
    rule: {
      // 上页最后一个 _id
      nextId: {
        required: false,
        type: 'string',
      },
      // 每页数量
      limit: {
        required: false,
        type: 'number',
      },
      // 排行榜 id
      rankId: {
        required: false,
        type: 'string',
      },
    },
  })
  async getLotteryRecord(message) {
    // 默认10页
    const limit = message.limit || 10;
    // 总数
    const count = await LotteryRecord.count({
      shortId: this.player.model.shortId,
    });
    let records;
    if (message.nextId) {
      records = await LotteryRecord.find({
        _id: {
          $lt: message.nextId,
        },
        shortId: this.player.model.shortId,
      }).limit(limit).sort({ _id: -1 })
    } else {
      records = await LotteryRecord.find({
        shortId: this.player.model.shortId,
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
          name: r.prizeConfig.name,
          price: r.prizeConfig.price,
          quantity: r.prizeConfig.quantity,
          source: r.prizeConfig.source,
        } || null,
      })
    }
    this.replySuccess({ list: resp, count });
  }

  // 领取奖品
  @addApi({
    rule: {
      // 奖品 id
      recordId: 'string'
    }
  })
  async receiveLotteryPrize(msg) {
    const resp = await service.lottery.receivePrize(msg.recordId)
    if (!resp.isOk) {
      console.error("领取奖品失败" + msg.recordId)
    } else {
      // 通知客户端资源更新
      await this.player.updateResource2Client()
    }
  }
}
