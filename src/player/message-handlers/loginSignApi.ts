import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import SevenSignPrize from "../../database/models/SevenSignPrize";
import SevenSignPrizeRecord from "../../database/models/SevenSignPrizeRecord";
import {service} from "../../service/importService";

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
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

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
    const receive = await SevenSignPrizeRecord.findOne({shortId: user.shortId, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receivePrize(prizeInfo, user, ConsumeLogType.chargeByActive, message.multiple);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await SevenSignPrizeRecord.create(data);

    return this.replySuccess(data);
  }

  async getSevenSignLists(user) {
    const prizeList = await SevenSignPrize.find();
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await SevenSignPrizeRecord.count({shortId: user.shortId,
      createAt: {$gte: start, $lt: end}});
    let days = await SevenSignPrizeRecord.count({shortId: user.shortId});
    if (!isTodaySign) {
      days++;
    }

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await SevenSignPrizeRecord.count({shortId: user.shortId, "prizeConfig.day": prizeList[i].day});
      prizeList[i].receive = !!receive;
    }

    return {isTodaySign: !!isTodaySign, days, datas: prizeList};
  }

  async receivePrize(prize, user, type, multiple = 1) {
    user.diamond += prize.diamond * multiple;
    user.gold += prize.gold * multiple;
    user.save();
    await service.playerService.logGemConsume(user._id, ConsumeLogType.chargeByActive, prize.diamond * multiple,
      user.diamond, `每日签到获得${prize.diamond * multiple}钻石`);
  }
}
