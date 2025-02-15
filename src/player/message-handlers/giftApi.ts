import {TianleErrorCode, ConsumeLogType, GlobalConfigKeys} from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import {service} from "../../service/importService";
import MonthGift from "../../database/models/MonthGift";
import MonthGiftRecord from "../../database/models/MonthGiftRecord";
import Player from "../../database/models/player";
import moment = require("moment");
import PlayerFreeGoldRecord from "../../database/models/PlayerFreeGoldRecord";
import {pick} from "lodash";
import SevenSignPrizeRecord from "../../database/models/SevenSignPrizeRecord";
import TurntablePrizeRecord from "../../database/models/turntablePrizeRecord";
import GoodsModel from "../../database/models/goods";
import * as config from '../../config'

export class GiftApi extends BaseApi {
  // 日卡/周卡/月卡
  @addApi()
  async giftLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const exclusiveList = ["专属头像框(无双王者)", "专属牌桌(浩瀚星河)", "破产救济金+50%", "幸运转盘+10次"];

    const prizeInfo = await MonthGift.findOne().lean();
    prizeInfo.expireTime = user.giftExpireTime > 0 && user.giftExpireTime > new Date().getTime() ? user.giftExpireTime : 0;
    prizeInfo.exclusiveList = exclusiveList;
    const regressionStartTime = user.regressionTime;
    if (regressionStartTime) {
      const regressionEndTime = new Date(Date.parse(regressionStartTime) + 1000 * 60 * 60 * 24 * config.game.regressionActivityDay);
      const currentTime = new Date().getTime();
      const payCount = await MonthGiftRecord.count({playerId: user._id, day: 30, isRegression: true, createAt: {$gte: regressionStartTime, $lt: regressionEndTime}});

      if (payCount === 0 && currentTime >= Date.parse(regressionStartTime) && currentTime <= regressionEndTime.getTime()) {
        const priceIndex = prizeInfo.dayList.findIndex(p => p.day === 30);
        if (priceIndex !== -1) {
          prizeInfo.dayList[priceIndex].price = 60;
        }
      }
    }

    return this.replySuccess(prizeInfo);
  }

  // 购买日卡/周卡/月卡
  @addApi({
    rule: {
      giftId: 'string',
      day: 'number'
    }
  })
  async payGift(message) {
    const model = await service.playerService.getPlayerModel(this.player.model._id);
    const prizeInfo = await MonthGift.findOne({_id: message.giftId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    let price = prizeInfo.dayList.find(item => item.day === message.day)?.price;
    let isRegression = false;
    const regressionStartTime = model.regressionTime;
    if (regressionStartTime && message.day === 30) {
      const regressionEndTime = new Date(Date.parse(regressionStartTime) + 1000 * 60 * 60 * 24 * config.game.regressionActivityDay);
      const currentTime = new Date().getTime();
      const payCount = await MonthGiftRecord.count({playerId: model._id, day: 30, isRegression: true, createAt: {$gte: regressionStartTime, $lt: regressionEndTime}});

      if (payCount === 0 && currentTime >= Date.parse(regressionStartTime) && currentTime <= regressionEndTime.getTime()) {
        const priceIndex = prizeInfo.dayList.findIndex(p => p.day === 30);
        if (priceIndex !== -1) {
          price = 60;
          isRegression = true;
        }
      }
    }

    if (model.diamond < price) {
      const template = await GoodsModel.findOne({ isOnline: true, goodsType: 1, amount: {$gte: price} }).sort({price: 1}).lean();
      return this.replyFail(TianleErrorCode.diamondInsufficient, {goodsId: template._id});
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      prizeInfo.prizeList[i].number *= message.day;
      prizeInfo.prizeList[i].day = message.day;
      await service.playerService.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple, ConsumeLogType.payMonthGift);
    }

    // 更新月卡到期时间
    model.diamond -= price;
    model.turntableTimes += 10;
    if (!model.giftExpireTime || model.giftExpireTime < new Date().getTime()) {
      model.giftExpireTime = new Date().getTime();
    }
    model.giftExpireTime = model.giftExpireTime + 1000 * 60 * 60 * 24 * message.day;
    await model.save();

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      day: message.day,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      isRegression,
      createAt: new Date()
    };

    await MonthGiftRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 每日福利免费领取金豆
  @addApi()
  async freeGold() {
    const user = await Player.findOne({shortId: this.player.model.shortId});
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();
    let gold = 30000;
    const lastRecord = await PlayerFreeGoldRecord.findOne({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}}).sort({createAt: -1});
    let lastReceiveTime = lastRecord ? Date.parse(lastRecord.createAt) : null;

    if (user.freeAdverCount > 0) {
      user.freeAdverCount--;
      user.gold += gold;
      await user.save();

      const freeAdverCount = await PlayerFreeGoldRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});
      lastReceiveTime = new Date().getTime();
      const data = {
        playerId: this.player._id.toString(),
        shortId: this.player.model.shortId,
        freeAdverCount: freeAdverCount + 1,
        gold: gold,
        createAt: new Date()
      }

      await PlayerFreeGoldRecord.create(data);

      this.player.sendMessage('resource/update', {ok: true, data: pick(user, ['gold', 'diamond', 'tlGold', 'redPocket'])});
      return this.replySuccess({gold: gold, freeAdverCount: freeAdverCount + 1, totalCount: user.freeAdverCount + freeAdverCount + 1, lastReceiveTime});
    }

    return this.replyFail(TianleErrorCode.receiveFail);
  }

  // 每日福利
  @addApi()
  async dailyWelfare() {
    const user = await Player.findOne({shortId: this.player.model.shortId});
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    // 转盘
    const freeCount = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveFreeCount) || 0;
    const todayLotteryCount = await this.todayLotteryCount(user._id.toString(), user.shortId);

    //免费领金豆
    const lastRecord = await PlayerFreeGoldRecord.findOne({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}}).sort({createAt: -1});
    const lastReceiveTime = lastRecord ? Date.parse(lastRecord.createAt) : 0;

    // 签到奖励
    const isTodaySign = await SevenSignPrizeRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});

    return this.replySuccess({freeGold: {count: user.freeAdverCount, lastReceiveTime}, turntable: {count: user.turntableTimes, freeCount, todayLotteryCount},
      dailySign: {count: isTodaySign === 0 ? 1 : 0, receive: !!isTodaySign}, benefit: {count: user.helpCount, gold: user.gold}});
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
