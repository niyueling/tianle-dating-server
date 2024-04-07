import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import {service} from "../../service/importService";
import VipConfig from "../../database/models/VipConfig";
import PlayerVipUpgradeRecord from "../../database/models/PlayerVipUpgradeRecord";

export class VipApi extends BaseApi {
  @addApi()
  async VipConfigLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getVipLists(user);

    return this.replySuccess(data);
  }

  @addApi({
    rule: {
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async receiveUpgradeGift(message) {
    // 获取奖励配置
    const prizeInfo = await VipConfig.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await PlayerVipUpgradeRecord.findOne({playerId: this.player._id, vip: prizeInfo.vip});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await service.playerService.receivePrize(prizeInfo.prizeList[i], this.player._id, 1, ConsumeLogType.receiveVip);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      vip: prizeInfo.vip,
      createAt: new Date()
    };

    await PlayerVipUpgradeRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  async getVipLists(user) {
    const prizeList = await VipConfig.find().sort({vip: 1}).lean();
    let player = await service.playerService.getPlayerModel(user._id);
    let vip = player.vip;
    let config;
    let rechargeAmount = 0;

    for (let i = 0; i < prizeList.length; i++) {
      prizeList[i].finish = vip >= prizeList[i].vip;
      const receiveCount = await PlayerVipUpgradeRecord.count({playerId: user._id, vip: prizeList[i].vip});
      prizeList[i].receive = !!receiveCount;

      if (!prizeList[i].finish && !config) {
        config = prizeList[i];
      }
    }

    if (config) {
      const experience = config.experience - player.vipExperience;
      rechargeAmount = Math.ceil(experience / 100);
    }

    return {config: {level: player.vip, experience: player.vipExperience, nextConfig: config, requireRecharge: rechargeAmount}, prizeList};
  }

}
