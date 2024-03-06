import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import {service} from "../../service/importService";
import MonthGift from "../../database/models/MonthGift";
import MonthGiftRecord from "../../database/models/MonthGiftRecord";

export class GiftApi extends BaseApi {
  // 日卡/周卡/月卡
  @addApi()
  async giftLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const prizeInfo = await MonthGift.findOne().lean();
    prizeInfo.expireTime = user.giftExpireTime > 0 && user.giftExpireTime > new Date().getTime() ? user.giftExpireTime : 0;

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
    const prizeInfo = await MonthGift.findOne({_id: message.giftId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    const price = prizeInfo.dayList.find(item => item.day === message.day)?.price;
    const model = await service.playerService.getPlayerModel(this.player.model._id);
    if (model.voucher < price) {
      return this.replyFail(TianleErrorCode.voucherInsufficient);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await service.playerService.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple, ConsumeLogType.receiveNewSign);
    }

    // 更新月卡到期时间
    model.voucher -= price;
    model.giftExpireTime = new Date().getTime() + 1000 * 60 * 60 * 24 * message.day;

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      day: message.day,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await MonthGiftRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }
}
