import { TianleErrorCode, ConsumeLogType } from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import {service} from "../../service/importService";
import Player from "../../database/models/player";
import NewSignPrizeRecord from "../../database/models/NewSignPrizeRecord";
import NewSignPrize from "../../database/models/NewSignPrize";
import HeadBorder from "../../database/models/HeadBorder";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import Medal from "../../database/models/Medal";
import PlayerMedal from "../../database/models/PlayerMedal";
import NewTask from "../../database/models/newTask";
import NewTaskRecord from "../../database/models/NewTaskRecord";

export class NewSignApi extends BaseApi {
  // 新人签到列表
  @addApi()
  async signLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getNewSignLists(user);

    return this.replySuccess(data);
  }

  // 领取新手签到奖励
  @addApi({
    rule: {
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async signIn(message) {
    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await NewSignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await NewSignPrizeRecord.findOne({playerId: this.player._id, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(TianleErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < prizeInfo.prizeList.length; i++) {
      await this.receivePrize(prizeInfo.prizeList[i], this.player._id, message.multiple);
    }

    // 创建领取记录
    const data = {
      playerId: this.player._id.toString(),
      shortId: this.player.model.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await NewSignPrizeRecord.create(data);
    await this.player.updateResource2Client();
    return this.replySuccess(data);
  }

  // 新人签到列表
  @addApi()
  async guideLists() {
    const user = await this.service.playerService.getPlayerModel(this.player.model._id);

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const data = await this.getGuideLists(user);

    return this.replySuccess(data);
  }

  async getGuideLists(user) {
    const taskList = await NewTask.find().lean();

    for (let i = 0; i < taskList.length; i++) {
      const receive = await NewTaskRecord.count({playerId: user._id, taskId: taskList[i].taskId});
      taskList[i].receive = !!receive;
    }

    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 10);

    return {taskList, activityTimes: {startTime, endTime}};
  }

  // 判断任务是否完成
  async checkTaskState(task) {
    // 判断任务是否完成
  }

  async getNewSignLists(user) {
    const prizeList = await NewSignPrize.find().lean();
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await NewSignPrizeRecord.count({playerId: user._id,
      createAt: {$gte: start, $lt: end}});
    let days = await NewSignPrizeRecord.count({playerId: user._id});
    if (!isTodaySign) {
      days++;
    }

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await NewSignPrizeRecord.count({playerId: user._id, "prizeConfig.day": prizeList[i].day});
      prizeList[i].receive = !!receive;
    }

    const startTime = user.createAt;
    const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 10);

    return {isTodaySign: !!isTodaySign, days, prizeList, activityTimes: {startTime, endTime}};
  }

  async receivePrize(prize, playerId, multiple = 1) {
    const user = await Player.findOne({_id: playerId});
    if (prize.type === 1) {
      user.diamond += prize.number * multiple;
      await service.playerService.logGemConsume(user._id, ConsumeLogType.receiveNewSign, prize.number * multiple,
        user.diamond, `新手签到获得${prize.number * multiple}钻石`);
    }

    if (prize.type === 2) {
      user.gold += prize.number * multiple;
      await service.playerService.logGoldConsume(user._id, ConsumeLogType.receiveNewSign, prize.number * multiple,
        user.gold, `新手签到获得${prize.number * multiple}金豆`);
    }

    if (prize.type === 3) {
      const config = await HeadBorder.findOne({propId: prize.propId}).lean();
      const playerHeadBorder = await PlayerHeadBorder.findOne({propId: prize.propId, playerId}).lean();

      // 如果头像框已过期，删除头像框
      if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
        await PlayerHeadBorder.remove({_id: playerHeadBorder._id});
      }

      if (config && !playerHeadBorder) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerHeadBorder.create(data);
      }
    }

    if (prize.type === 4) {
      const config = await Medal.findOne({propId: prize.propId}).lean();
      const playerMedal = await PlayerMedal.findOne({propId: prize.propId, playerId}).lean();

      // 如果称号已过期，删除称号
      if (playerMedal && playerMedal.times !== -1 && playerMedal.times <= new Date().getTime()) {
        await PlayerMedal.remove({_id: playerMedal._id});
      }

      if (config && !playerMedal) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerMedal.create(data);
      }
    }

    await user.save();
  }
}
