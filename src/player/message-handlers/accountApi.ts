import {GameType, TianleErrorCode, UserRegistLocation, shopPropType} from "@fm/common/constants";
import * as moment from "moment";
import ChannelManager from "../../chat/channel-manager";
import * as config from "../../config";
import {getNewShortPlayerId} from "../../database/init";
import Player from "../../database/models/player";
import RoomRecord from "../../database/models/roomRecord";
import {service} from "../../service/importService";
import {signAndRecord} from "../../utils/jwt";
import PlayerManager from "../player-manager";
import {addApi, BaseApi} from "./baseApi";
import WatchAdverRecord from "../../database/models/watchAdverRecord";
import {pick} from "lodash/lodash";
import Mail from "../../database/models/mail";
import TurntablePrizeRecord from "../../database/models/turntablePrizeRecord";
import CardTable from "../../database/models/CardTable";
import PlayerCardTable from "../../database/models/PlayerCardTable";
import Medal from "../../database/models/Medal";
import PlayerMedal from "../../database/models/PlayerMedal";
import HeadBorder from "../../database/models/HeadBorder";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import SevenSignPrizeRecord from "../../database/models/SevenSignPrizeRecord";
import RoomScoreRecord from "../../database/models/roomScoreRecord";
import PlayerBenefitRecord from "../../database/models/PlayerBenefitRecord";
import NewDiscountGiftRecord from "../../database/models/NewDiscountGiftRecord";
import Lobby from "../../match/lobby";
import StartPocketRecord from "../../database/models/startPocketRecord";
import NewSignPrizeRecord from "../../database/models/NewSignPrizeRecord";
import CombatGain from "../../database/models/combatGain";
import GameRecord from "../../database/models/gameRecord";
import GoodsProp from "../../database/models/GoodsProp";
import PlayerProp from "../../database/models/PlayerProp";

export class AccountApi extends BaseApi {
  // 根据 shortId 查询用户
  @addApi()
  async queryByShortId(message) {
    const user = await Player.findOne({shortId: this.player.model.shortId}).lean();
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    user.disconnectedRoom = false
    const disconnectedRoom = Lobby.getInstance().getDisconnectedRoom(user._id.toString());
    if (disconnectedRoom) {
      user.disconnectedRoom = true;
    }

    const allGameTypes = [GameType.mj, GameType.xueliu, GameType.guobiao, GameType.pcmj, GameType.xmmj, GameType.ddz];
    for (let i = 0; i < allGameTypes.length; i++) {
      // 下发掉线子游戏
      const room = await service.roomRegister.getDisconnectRoomByPlayerId(user._id.toString(), allGameTypes[i]);
      if (room) {
        // 掉线的子游戏类型
        user.disconnectedRoom = true;
        user.disconnectedRoomId = room;
        user.continueGameType = allGameTypes[i];
      }
    }

    if (message.mnpVersion) {
      // 是否开启商店
      const checkVersion = await service.utils.getGlobalConfigByName('mnpRechargeVersion');
      // 1 = 开启全部商店
      const open = await service.utils.getGlobalConfigByName('openMnpRecharge');
      let iosRoomCount = 0;
      let iosLotteryCount = 0;
      let openIosShopFunc = message.mnpVersion && open === 1 && (message.mnpVersion !== checkVersion)

      // 如果机型是ios，查询抽奖次数和开房数
      if (message.platform && message.platform === "iOS") {
        iosRoomCount = await RoomScoreRecord.count({
          creatorId: user.shortId
        })

        iosLotteryCount = await TurntablePrizeRecord.count({
          playerId: user._id
        })
        user.iosRoomCount = iosRoomCount;
        user.iosLotteryCount = iosLotteryCount;

        const isTest = user.nickname.indexOf("test") !== -1 || user.nickname.indexOf("tencent_game") !== -1;

        openIosShopFunc = openIosShopFunc && iosRoomCount >= 3 && iosLotteryCount >= 2 && !isTest;
      }

      user.openIosShopFunc = openIosShopFunc;
    }

    // 获取用户称号
    const playerMedal = await PlayerMedal.findOne({playerId: user._id, isUse: true});
    if (playerMedal && (playerMedal.times === -1 || playerMedal.times > new Date().getTime())) {
      user.medalId = playerMedal.propId;
    }

    // 获取用户头像框
    const playerHeadBorder = await PlayerHeadBorder.findOne({playerId: user._id, isUse: true});
    if (playerHeadBorder && (playerHeadBorder.times === -1 || playerHeadBorder.times > new Date().getTime())) {
      user.headerBorderId = playerHeadBorder.propId;
    }

    this.replySuccess(user);
  }

  // 救济金数据
  @addApi()
  async benefitData() {
    const user = await Player.findOne({shortId: this.player.model.shortId});
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    if (user.helpCount > 0) {
      const start = moment(new Date()).startOf('day').toDate();
      const end = moment(new Date()).endOf('day').toDate();
      const helpCount = await PlayerBenefitRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});
      let gold = 100000;

      if (user.giftExpireTime && user.giftExpireTime > new Date().getTime()) {
        gold += gold * 0.5;
      }

      return this.replySuccess({gold: gold, helpCount: helpCount + 1, totalCount: user.helpCount + helpCount});
    }

    return this.replyFail(TianleErrorCode.receiveFail);
  }

  // 发放救济金
  @addApi()
  async benefit() {
    const user = await Player.findOne({shortId: this.player.model.shortId});
    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    let gold = 100000;

    if (user.giftExpireTime && user.giftExpireTime > new Date().getTime()) {
      gold += gold * 0.5;
    }

    if (user.helpCount > 0) {
      user.helpCount--;
      user.gold += gold;
      await user.save();

      const start = moment(new Date()).startOf('day').toDate();
      const end = moment(new Date()).endOf('day').toDate();
      const helpCount = await PlayerBenefitRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});

      const data = {
        playerId: this.player._id.toString(),
        shortId: this.player.model.shortId,
        helpCount: helpCount + 1,
        gold: gold,
        createAt: new Date()
      }

      await PlayerBenefitRecord.create(data);

      this.player.sendMessage('resource/update', {ok: true, data: pick(user, ['gold', 'diamond', 'tlGold'])})
      return this.replySuccess({gold: gold, helpCount: helpCount + 1, totalCount: user.helpCount + helpCount + 1});
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
    const index = Math.floor(Math.random() * (215 - 1 + 1)) + 1;
    const defaultAvatar = `https://tianlegame.hfdsdas.cn/uploads/images/${index}.png`;

    const data = {
      unionid: resp.unionid,
      openid: resp.openid,
      shortId,
      avatar: defaultAvatar,
      tlGold: 0,
      nickname: `用户${shortId}`,
      sessionKey: resp.sessionKey,
      source: UserRegistLocation.wechat,
      ip: this.player.getIpAddress(),
      robot: !resp.unionid,
      tourist: !resp.unionid,
    }


    const userInfo = await service.playerService.checkUserRegist(player, data);

    return await this.loginSuccess(userInfo, message.mnpVersion, message.platform);
  }

  // 返回登录信息
  async loginSuccess(model, mnpVersion, platform) {
    this.player.model = model;

    model.disconnectedRoom = false
    const disconnectedRoom = Lobby.getInstance().getDisconnectedRoom(model._id.toString());
    if (disconnectedRoom) {
      console.warn("disconnectedRoom-%s", JSON.stringify(disconnectedRoom));
      model.disconnectedRoom = true;
    }

    const allGameTypes = [GameType.mj, GameType.xueliu, GameType.guobiao, GameType.pcmj, GameType.xmmj, GameType.ddz];
    for (let i = 0; i < allGameTypes.length; i++) {
      // 下发掉线子游戏
      const room = await service.roomRegister.getDisconnectRoomByPlayerId(model._id.toString(), allGameTypes[i]);
      if (room) {
        // 掉线的子游戏类型
        model.disconnectedRoom = true;
        model.disconnectedRoomId = room;
        model.continueGameType = allGameTypes[i];
      }
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
      if (platform && platform === "iOS") {
        iosRoomCount = await RoomScoreRecord.count({
          creatorId: model.shortId
        })

        iosLotteryCount = await TurntablePrizeRecord.count({
          playerId: model._id
        })

        const isTest = model.nickname.indexOf("test") !== -1 || model.nickname.indexOf("tencent_game") !== -1;

        openIosShopFunc = openIosShopFunc && iosRoomCount >= 3 && iosLotteryCount >= 2 && !isTest;
      }

      model.openIosShopFunc = openIosShopFunc;
      // model.openIosShopFunc = true;
    }

    const mails = await Mail.findOne({to: model._id}).lean()
    if (!mails) {
      await Mail.create({
        type: "message",
        state: 1,
        giftState: 1,
        to: model._id,
        title: "欢迎来到天乐麻将",
        content: "欢迎来到天乐麻将,如果您在游戏过程中遇到任何问题，可以通过客服联系我们，我们会第一时间给您提供必要的帮助!",
        gift: { diamond : 0, gold : 0 },
        createAt: new Date() });
    }

    // 获取用户称号
    const playerMedal = await PlayerMedal.findOne({playerId: model._id, isUse: true});
    if (playerMedal && (playerMedal.times === -1 || playerMedal.times > new Date().getTime())) {
      model.medalId = playerMedal.propId;
    }

    // 获取用户头像框
    const playerHeadBorder = await PlayerHeadBorder.findOne({playerId: model._id, isUse: true});
    if (playerHeadBorder && (playerHeadBorder.times === -1 || playerHeadBorder.times > new Date().getTime())) {
      model.headerBorderId = playerHeadBorder.propId;
    }

    // 判断用户最后一次参与游戏类型
    const roomInfo = await CombatGain.findOne({playerId: model._id}).sort({time: -1});
    if (roomInfo) {
      const roomrecord = await RoomRecord.findOne({room: roomInfo.room});
      if (roomrecord) {
        model.lastGame = {
          gameType: roomrecord.category,
          gameName: roomInfo.gameName,
          categoryId: roomrecord.rule.categoryId,
          categoryName: roomInfo.caregoryName
        }
      }
    }

    // 记录玩家
    PlayerManager.getInstance().addPlayer(this.player);
    const channel = ChannelManager.getInstance().getChannel();
    channel.join(this.player);
    this.player.isLoggingIn = false;
    PlayerManager.getInstance().removeLoggingInPlayer(model._id.toString());

    this.replySuccess(model);
  }

  async shareRecord(roomNum: number) {
    const result = await RoomRecord.findOne({ roomNum: Number(roomNum) });
    const gameRecords = await GameRecord.find({ roomId: roomNum.toString() }).sort({juShu: 1});
    let players = [];
    if (result && result.scores) {
      // 过滤 null,从大到小排列
      players = result.scores.filter(value => value).sort((a, b) => {
        return b.score - a.score;
      })

      // 格式化players数组
      for (let i = 0; i < players.length; i++) {
        players[i] = {...players[i], ...{huCount: 0, ziMo: 0, dianPao: 0, jieGang: 0, fangGang: 0}};
      }

      // 获取用户结算数据
      for (let i = 0; i < gameRecords.length; i++) {
        const states = gameRecords[i].states;
        for (let j = 0; j < states.length; j++) {
          players[j].jieGang += states[j].jieGangCount;
          players[j].fangGang += states[j].fangGangCount;
          if (states[j].events.zimo) {
            players[j].ziMo++;
            players[j].huCount++;
          }
          if (states[j].events.jiePao) {
            players[j].huCount++;
          }
          if (states[j].events.dianPao) {
            players[j].dianPao++;
          }
        }
      }
    }

    let gameName = '';
    if (result && result.category) {
      gameName = result.category;
    }

    this.player.sendMessage("game/shareRecordReply", {
      roomNum: roomNum,
      // 玩家列表
      players,
      rule: result.rule,
      // 创建时间
      createAt: result && result.createAt || new Date(),
      // 游戏名称
      gameName,
    });
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
        "isPlayerDel": { $ne: playerId },
        "createAt": {
          $gte: start,
        },
        // 过滤金豆房
        // "rule.isPublic": false,
      })
      .sort({createAt: -1})
      .lean()
      .exec()
    const formatted = records.map(r => {
      return {
        _id: r.room,
        roomId: r.roomNum,
        time: r.createAt.getTime(),
        creatorId: r.creatorId,
        players: r.scores
      }
    })
    this.replySuccessDirect({ok: true, data: formatted});
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
      avatar: "string?",
      nickname: "string?",
      sex: "number?",
    }
  })
  async updateUserInfo(msg) {
    const model = await service.playerService.getPlayerModel(this.player.model._id)
    if (msg.avatar) {
      model.avatar = msg.avatar;
    }
    if (msg.nickname) {
      model.nickname = msg.nickname;
    }
    if (msg.sex) {
      model.sex = msg.sex;
    }

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

  // 背包
  @addApi()
  async backpack(message) {
    let lists = [];

    // 牌桌
    if (message.type === 1) {
      lists = await this.getBackPackByCardTable();
    }

    // 称号
    if (message.type === 2) {
      lists = await this.getBackPackByMedal();
    }

    // 头像框
    if (message.type === 3) {
      lists = await this.getBackPackByHeader();
    }

    // 道具
    if (message.type === 4) {
      lists = await this.getBackPackByProp();
    }

    return this.replySuccess({lists, type: message.type});
  }

  // 更换背包使用
  @addApi()
  async changeBackPackUse(message) {
    let record = {};
    // 牌桌
    if (message.type === 1) {
      record = await this.changeBackPackByCardTable(message.propId);
    }

    // 称号
    if (message.type === 2) {
      record = await this.changeBackPackByMedal(message.propId);
    }

    // 头像框
    if (message.type === 3) {
      record = await this.changeBackPackByHeader(message.propId);
    }

    return this.replySuccess({record, type: message.type});
  }

  // 获取活动开关
  @addApi({
    rule: {
      mnpVersion: 'string',
      platform: 'string',
    }
  })
  async getActivity(message) {
    const user = await Player.findOne({_id: this.player._id}).lean();

    if (!user) {
      return this.replyFail(TianleErrorCode.userNotFound);
    }

    const activity = await this.getActivityInfo(user, message.mnpVersion, message.platform);

    return this.replySuccess(activity);
  }

  async getActivityInfo(user, mnpVersion, platform) {
    const start = moment(new Date()).startOf('day').toDate();
    const end = moment(new Date()).endOf('day').toDate();

    // 是否开启商店
    const checkVersion = await service.utils.getGlobalConfigByName('mnpRechargeVersion');
    // 1 = 开启全部商店
    const open = await service.utils.getGlobalConfigByName('openMnpRecharge');
    let iosRoomCount = 0;
    let iosLotteryCount = 0;
    let openIosShopFunc = mnpVersion && open === 1 && (mnpVersion !== checkVersion)

    // 如果机型是ios，查询抽奖次数和开房数
    if (platform && platform === "iOS") {
      iosRoomCount = await RoomScoreRecord.count({
        creatorId: user.shortId
      })

      iosLotteryCount = await TurntablePrizeRecord.count({
        playerId: user._id
      })
      user.iosRoomCount = iosRoomCount;
      user.iosLotteryCount = iosLotteryCount;

      const isTest = user.nickname.indexOf("test") !== -1 || user.nickname.indexOf("tencent_game") !== -1;

      openIosShopFunc = openIosShopFunc && iosRoomCount >= 3 && iosLotteryCount >= 2 && !isTest;
    }

    user.openIosShopFunc = openIosShopFunc;

    // 判断7日签到是否开放
    const sevenLoginCount = await SevenSignPrizeRecord.count({playerId: user._id, createAt: {$gte: start, $lt: end}});

    // 判断开运红包是否开放
    const startPocketCount = await StartPocketRecord.count({playerId: this.player.model._id, createAt: {$gte: start, $lt: end}});

    // 判断新人福利
    const payCount = await NewDiscountGiftRecord.count({playerId: this.player._id.toString()});

    // 判断新人宝典开关
    let newGift = {
      open: new Date().getTime() <= Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10,
      popOpen: false,
      iosRecharge: user.openIosShopFunc,
      iosRoomCount,
      iosLotteryCount
    };
    // 判断新手签到是否可领取
    const todayReceiveCount = await NewSignPrizeRecord.count({playerId: user._id,
      createAt: {$gte: start, $lt: end}});
    let days = await NewSignPrizeRecord.count({playerId: user._id});
    if (days < 7 && todayReceiveCount === 0) {
      newGift.popOpen = true;
    }

    // 判断初见指引是否可领取
    const guideInfo = await service.playerService.getGuideLists(user);
    if (guideInfo.receive) {
      newGift.popOpen = true;
    }

    // 判断首充奖励是否可领取
    const firstRecharge = await service.playerService.getFirstRechargeList(user);
    if (firstRecharge.receive && firstRecharge.isPay) {
      newGift.popOpen = true;
    }

    // 判断活动是否过期
    if (new Date().getTime() > Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10) {
      newGift.popOpen = false;
    }

    // 判断充值派对开关
    let rechargeParty = {
      open: new Date().getTime() <= Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10,
      popOpen: false,
      iosRecharge: user.openIosShopFunc,
      iosRoomCount,
      iosLotteryCount
    };
    const rechargePartyInfo = await service.playerService.getRechargePartyList(user);
    if (new Date().getTime() <= Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10 && (!rechargePartyInfo.freeGiftReceive || (rechargePartyInfo.partyOne.todayFinish && !rechargePartyInfo.partyOne.todayReceive)
    || (rechargePartyInfo.partySix.todayFinish && !rechargePartyInfo.partySix.todayReceive) ||
      (rechargePartyInfo.partyThirty.todayFinish && !rechargePartyInfo.partyThirty.todayReceive))) {
      rechargeParty.popOpen = true;
    }

    // 成就
    const taskInfo= await service.playerService.getDailyTaskData(user);

    return {
      sevenLogin: {open: true, popOpen: sevenLoginCount === 0, redDot: sevenLoginCount === 0},
      turnTable: {popOpen: user.turntableTimes > 0, open: true, redDot: user.turntableTimes > 0},
      startPocket: {open: true, popOpen: startPocketCount === 0, redDot: startPocketCount === 0},
      newGift: {open: newGift.open, popOpen: newGift.popOpen, redDot: newGift.popOpen},
      discountGift: {open: payCount === 0, popOpen: payCount === 0, redDot: payCount === 0},
      rechargeParty: {open: rechargeParty.open, popOpen: rechargeParty.popOpen, redDot: rechargeParty.popOpen},
      task: {open: true, popOpen: taskInfo.canReceive, redDot: taskInfo.canReceive}
    };
  }

  async getBackPackByCardTable() {
    const lists = await CardTable.find().lean();

    for (let i = 0; i < lists.length; i++) {
      const playerCardTable = await PlayerCardTable.findOne({playerId: this.player._id, propId: lists[i].propId});

      // 用户是否拥有该牌桌
      lists[i].isHave = playerCardTable ? (playerCardTable.times === -1 || playerCardTable.times >= new Date().getTime()) : false;
      // 牌桌有效期
      lists[i].times = playerCardTable && (playerCardTable.times === -1 || playerCardTable.times >= new Date().getTime()) ? playerCardTable.times: null;
      // 牌桌是否正在使用,
      lists[i].isUse = playerCardTable && (playerCardTable.times === -1 || playerCardTable.times >= new Date().getTime()) ? playerCardTable.isUse: false;
    }

    return lists;
  }

  async getBackPackByMedal() {
    const lists = await Medal.find().lean();

    for (let i = 0; i < lists.length; i++) {
      const playerMedal = await PlayerMedal.findOne({playerId: this.player._id, propId: lists[i].propId});

      // 用户是否拥有该称号
      lists[i].isHave = playerMedal ? (playerMedal.times === -1 || playerMedal.times >= new Date().getTime()) : false;
      // 称号有效期
      lists[i].times = playerMedal && (playerMedal.times === -1 || playerMedal.times >= new Date().getTime()) ? playerMedal.times : null;
      // 称号是否正在使用
      lists[i].isUse = playerMedal && (playerMedal.times === -1 || playerMedal.times >= new Date().getTime()) ? playerMedal.isUse : false;
      // 称号获得时间
      lists[i].getTime = playerMedal && (playerMedal.times === -1 || playerMedal.times >= new Date().getTime()) ? playerMedal.createAt : null;
    }

    return lists;
  }

  async getBackPackByHeader() {
    const lists = await HeadBorder.find().lean();

    for (let i = 0; i < lists.length; i++) {
      const playerHeadBorder = await PlayerHeadBorder.findOne({playerId: this.player._id, propId: lists[i].propId});

      // 用户是否拥有该头像框
      lists[i].isHave = playerHeadBorder ? (playerHeadBorder.times === -1 || playerHeadBorder.times >= new Date().getTime()) : false;
      // 头像框有效期
      lists[i].times = playerHeadBorder && (playerHeadBorder.times === -1 || playerHeadBorder.times >= new Date().getTime()) ? playerHeadBorder.times : null;
      // 头像框是否正在使用
      lists[i].isUse = playerHeadBorder && (playerHeadBorder.times === -1 || playerHeadBorder.times >= new Date().getTime()) ? playerHeadBorder.isUse : false;
    }

    return lists;
  }

  async getBackPackByProp() {
    const lists = await GoodsProp.find({propType: {$ne: shopPropType.headBorder}}).lean();

    for (let i = 0; i < lists.length; i++) {
      lists[i].isHave = false;
      lists[i].times = 0;
      lists[i].number = 0;
      const playerProp = await PlayerProp.findOne({playerId: this.player._id, propId: lists[i].propId});

      if (playerProp) {
        if (playerProp.payType === 1) {
          // 用户是否拥有该道具
          lists[i].isHave = playerProp.times === -1 || playerProp.times >= new Date().getTime();
          // 道具有效期
          lists[i].times = playerProp.times === -1 || playerProp.times >= new Date().getTime() ? playerProp.times : null;
        }

        if (playerProp.payType === 2) {
          // 用户是否拥有该道具
          lists[i].isHave = playerProp.number > 0;
          // 道具有效期
          lists[i].number = playerProp.number;
        }
      }

      lists[i].payType === 1 ? delete lists[i].number : delete lists[i].times;
    }

    return lists;
  }

  async changeBackPackByCardTable(propId) {
    const config = await CardTable.findOne({propId}).lean();
    const playerCardTable = await PlayerCardTable.findOne({playerId: this.player._id, propId});

    if (!config) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }
    if (!playerCardTable || (playerCardTable && playerCardTable.times !== -1 && playerCardTable.times < new Date().getTime())) {
      return this.replyFail(TianleErrorCode.cardTableInvaid);
    }

    // 设置其他牌桌为未使用状态
    await PlayerCardTable.updateMany({playerId: this.player._id, isUse: true}, {$set: {isUse: false}});

    // 设置当前牌桌为使用状态
    playerCardTable.isUse = true;
    await playerCardTable.save();

    return playerCardTable;
  }

  async changeBackPackByMedal(propId) {
    const config = await Medal.findOne({propId}).lean();
    const playerMedal = await PlayerMedal.findOne({playerId: this.player._id, propId});

    if (!config) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }
    if (!playerMedal || (playerMedal && playerMedal.times !== -1 && playerMedal.times < new Date().getTime())) {
      return this.replyFail(TianleErrorCode.cardTableInvaid);
    }

    // 设置其他牌桌为未使用状态
    await PlayerMedal.updateMany({playerId: this.player._id, isUse: true}, {$set: {isUse: false}});

    // 设置当前牌桌为使用状态
    playerMedal.isUse = true;
    await playerMedal.save();

    return playerMedal;
  }

  async changeBackPackByHeader(propId) {
    const config = await HeadBorder.findOne({propId}).lean();
    const playerHeadBorder = await PlayerHeadBorder.findOne({playerId: this.player._id, propId});

    if (!config) {
      return this.replyFail(TianleErrorCode.configNotFound);
    }
    if (!playerHeadBorder || (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times < new Date().getTime())) {
      return this.replyFail(TianleErrorCode.cardTableInvaid);
    }

    // 设置其他牌桌为未使用状态
    await PlayerHeadBorder.updateMany({playerId: this.player._id, isUse: true}, {$set: {isUse: false}});

    // 设置当前牌桌为使用状态
    playerHeadBorder.isUse = true;
    await playerHeadBorder.save();

    return playerHeadBorder;
  }
}
