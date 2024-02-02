import {UserRegistLocation, TianleErrorCode, GameType} from "@fm/common/constants";
import * as moment from "moment";
import ChannelManager from "../../chat/channel-manager";
import * as config from "../../config";
import {getNewShortPlayerId} from "../../database/init";
import LotteryRecord from "../../database/models/lotteryRecord";
import Notice from "../../database/models/notice";
import Player from "../../database/models/player";
import RoomRecord from "../../database/models/roomRecord";
import Lobby from "../../match/lobby";
import {service} from "../../service/importService";
import {signAndRecord} from "../../utils/jwt";
import PlayerManager from "../player-manager";
import {addApi, BaseApi} from "./baseApi";
import WatchAdverRecord from "../../database/models/watchAdverRecord";
import {pick} from "lodash/lodash";

export class AccountApi extends BaseApi {
  // 根据 shortId 查询用户
  @addApi()
  async queryByShortId() {
    const user = await Player.findOne({shortId: this.player.model.shortId}).exec();
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    this.replySuccess(user);
  }

  // 发放救济金
  @addApi()
  async benefit() {
    const user = await Player.findOne({shortId: this.player.model.shortId});
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }
    if (user.helpCount < config.game.helpCount) {
      user.helpCount++;
      user.gold += 1000000000;
      user.save();
      this.player.sendMessage('resource/update', {ok: true, data: pick(user, ['gold', 'diamond'])})
      return this.replySuccess({gold: 1000000000, helpCount: user.helpCount, totalCount: config.game.helpCount});
    }

    return this.replyFail(TianleErrorCode.receiveFail);
  }

  // 微信登录
  @addApi({
    rule: {
      code: 'string?',
      unionid: 'string?',
      source: 'number?',
      mnpVersion: 'string?',
      platform: 'string?'
    }
  })
  async loginGame(message) {
    let resp = {
      openid: null,
      sessionKey: null,
      unionid: null,
    };
    let player;
    if (message.code) {
      resp = await service.wechat.getWechatInfoByQuickApp(config.wechat.quickAppId, config.wechat.quickSecret,
          message.code);
      if (!resp) {
        return this.replyFail(TianleErrorCode.codeInvalid);
      }
    }

    if (resp.unionid) {
      player = await Player.findOne({unionid: resp.unionid});
    }

    if (!message.code && message.unionid) {
      player = await Player.findOne({_id: message.unionid});
    }

    const shortId = await getNewShortPlayerId()
    const avatarIndex = Math.floor(Math.random() * 19) + 1;
    const defaultAvatar = `https://phpadmin.tianle.fanmengonline.com/uploads/images/avatars/${avatarIndex}.png`;

    const data = {
      unionid: resp.unionid,
      openid: resp.openid,
      shortId,
      avatar: defaultAvatar,
      nickname: `用户${shortId}`,
      sessionKey: resp.sessionKey,
      source: UserRegistLocation.wechat,
      ip: this.player.getIpAddress(),
      robot: !resp.unionid,
      diamond: 1000,
    }


    const userInfo = await service.playerService.checkUserRegist(player, data);

    return await this.loginSuccess(userInfo, message.mnpVersion, message.platform);
  }

  // 返回登录信息
  async loginSuccess(model, mnpVersion, platform) {
    this.player.model = model;

    // const disconnectedRoom = Lobby.getInstance().getDisconnectedRoom(model._id.toString());
    // console.warn(disconnectedRoom)
    // if (disconnectedRoom) {
    //   model.disconnectedRoom = true;
    // }
    // 下发掉线子游戏
    const room = await service.roomRegister.getDisconnectRoomByPlayerId(model._id.toString());
    console.warn(room)
    if (room) {
      // 掉线的子游戏类型
      model.disconnectedRoom = true;
      model.continueGameType = GameType.mj;
    } else {
      // 没有掉线的房间号，不要重连
      model.disconnectedRoom = false
    }

    // add token
    model.token = await signAndRecord({playerId: model._id.toString()}, model._id.toString());
    if (mnpVersion) {
      // 是否开启商店
      const checkVersion = await service.utils.getGlobalConfigByName('mnpRechargeVersion');
      // 1 = 开启全部商店
      const open = await service.utils.getGlobalConfigByName('openMnpRecharge');
      let iosRoomCount = 0;
      let iosLotteryCount = 0;
      let openIosShopFunc = mnpVersion && open === 1 && (mnpVersion !== checkVersion)

      // 如果机型是ios，查询抽奖次数和开房数
      if (platform && platform === "ios") {
        iosRoomCount = await RoomRecord.count({
          creatorId: model.shortId
        })

        iosLotteryCount = await LotteryRecord.count({
          shortId: model.shortId
        })

        const isTest = model.nickname.indexOf("test") !== -1 || model.nickname.indexOf("tencent_game") !== -1;

        openIosShopFunc = openIosShopFunc && iosRoomCount >= 10 && iosLotteryCount >= 3 && !isTest;
      }

      model.openIosShopFunc = openIosShopFunc;
    }

    const notice = await Notice.findOne().sort({createAt: -1}).exec()
    if (notice) {
      this.player.sendMessage('global/notice', notice.message);
    }

    // 记录玩家
    PlayerManager.getInstance().addPlayer(this.player);

    const channel = ChannelManager.getInstance().getChannel();
    channel.join(this.player);
    this.player.isLoggingIn = false;
    PlayerManager.getInstance().removeLoggingInPlayer(model._id.toString());

    return this.replySuccess(model);
  }

  // 公共房战绩列表
  @addApi({
    apiName: 'recordList'
  })
  async getRecordList(message) {
    const playerId = this.player.id
    // 下发 3天的数据
    const start = moment().subtract(2, 'days').startOf('day').toDate()
    const records = await RoomRecord
      .find({
        "players": playerId,
        "category": message.gameType,
        "isPlayerDel": { $ne: playerId },
        "createAt": {
          $gte: start,
        },
        // 过滤金豆房
        "rule.isPublic": false,
      })
      .sort({createAt: -1})
      .lean()
      .exec()
    const formatted = records.map(r => {
      return {
        _id: r.room,
        roomId: r.roomNum,
        time: r.createAt.getTime(),
        players: r.scores
      }
    })
    this.replySuccessDirect(formatted);
  }

  // 删除公共房记录
  @addApi()
  async deleteRoomRecord(message) {
    const playerId = this.player.id;
    const record = await RoomRecord.findOne({ room: message.room, players: playerId });
    if (!record) {
      return this.replyFail('记录已删除');
    }
    if (record.isPlayerDel) {
      if (record.isPlayerDel.indexOf(playerId) === -1) {
        record.isPlayerDel.push(playerId);
      }
    } else {
      record.isPlayerDel = [playerId];
    }
    await record.save();
    return this.replySuccessWithInfo('移除成功');
  }

  //更新用户头像，昵称
  @addApi({
    rule: {
      avatar: "string",
      nickname: "string",
    }
  })
  async updateUserInfo(msg) {
    const model = await service.playerService.getPlayerModel(this.player.model._id)
    model.avatar = msg.avatar;
    model.nickname = msg.nickname;
    model.isBindWechat = true;
    await model.save();
    this.replySuccess(model);
  }

  // 记录观看视频日志
  @addApi({
    rule: {
      adId: "string?",
      adPosition: "string?"
    }
  })
  async addWatchAdverLog(message) {
    const data = {
      playerId: this.player.model._id,
      shortId: this.player.model.shortId,
      adId: null,
      adPosition: null
    };

    if (message.adId) {
      data.adId = message.adId;
    }

    if (message.adPosition) {
      data.adPosition = message.adPosition;
    }

    const record = await WatchAdverRecord.create(data);

    return this.replySuccess(record);
  }
}
