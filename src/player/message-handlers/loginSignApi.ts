import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import SevenSignPrize from "../../database/models/SevenSignPrize";
import SevenSignPrizeRecord from "../../database/models/SevenSignPrizeRecord";
import {service} from "../../service/importService";
import StartPocketRecord from "../../database/models/startPocketRecord";
import Player from "../../database/models/player";

export class LoginSignApi extends BaseApi {
  // 7日登录列表
  @addApi()
  async sevenSignLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getSevenSignLists(user);

    return this.replySuccess(data);
  }

  // 领取7日登录奖励
  @addApi({
    rule: {
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async sevenSignIn(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await SevenSignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await SevenSignPrizeRecord.findOne({playerId: this.player._id, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receivePrize(prizeInfo, this.player._id, message.multiple);

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await SevenSignPrizeRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 开运红包数据接口
  @addApi()
  async startPocketData() {
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();
    const receive = await StartPocketRecord.findOne({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});

    return this.replySuccess({receive: !!receive, amount: 800000, base: 100000});
  }

  // 领取开运红包
  @addApi()
  async receiveStartPocket() {
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();
    const point = Math.floor(Math.random() * 6) + 1;

    // 判断今日是否领取
    const count = await StartPocketRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});
    if (count > 0) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    const rank = point === 1 ? 8 : point;
    const amount = 100000 * rank;

    let user = await this.service.playerService.getPlayerModel(this.player.model._id);
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    user.gold += amount;
    await user.save();

    await service.playerService.logGoldConsume(user._id, ConsumeLogType.receiveStartPocket, amount,
      user.gold, `领取开运红包`);

    await this.player.updateResource2Client();

    // 记录日志
    await StartPocketRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      amount: amount,
      point,
      rank,
    });

    return this.replySuccess({point, rank, amount, base: 100000});
  }

  async getSevenSignLists(user) {
    const prizeList = await SevenSignPrize.find().sort({day: 1});
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await SevenSignPrizeRecord.count({playerId: user._id,
      createAt: {$gte: start, $lt: end}});
    let player = await service.playerService.getPlayerModel(user._id);
    let days = player.signLoginDays;
    if (!isTodaySign) {
      days++;
    }

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await SevenSignPrizeRecord.count({playerId: user._id, "prizeConfig.day": prizeList[i].day});
      prizeList[i].receive = !!receive;
    }

    return {isTodaySign: !!isTodaySign, days, datas: prizeList};
  }

  async receivePrize(prize, playerId, multiple = 1) {
    const user = await Player.findOne({_id: playerId});
    if (prize.type === 1) {
      user.diamond += prize.number * multiple;
      await service.playerService.logGemConsume(user._id, ConsumeLogType.chargeByActive, prize.number * multiple,
        user.diamond, `每日签到获得${prize.number * multiple}钻石`);
    }

    if (prize.type === 2) {
      user.gold += prize.number * multiple;
      await service.playerService.logGoldConsume(user._id, ConsumeLogType.receiveSevenLogin, prize.number * multiple,
        user.gold, `领取7日登陆`);
    }

    user.signLoginDays = prize.day === 7 ? 0 : prize.day;
    user.totalSignLoginDays ++;
    if (prize.day === 7) {
      await SevenSignPrizeRecord.remove({shortId: user.shortId});
    }

    await user.save();
  }
}
