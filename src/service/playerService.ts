// @ts-ignore
import * as faker from 'faker';
import * as mongoose from 'mongoose';
import * as config from "../config";
import {getNewPlayerInviteCode, getNewShortPlayerId} from "../database/init";
import ConsumeRecord from "../database/models/consumeRecord";
import DiamondRecord from "../database/models/diamondRecord";
import PlayerModel from "../database/models/player";
import Player from "../database/models/player";
import BaseService from "./base";
import {service} from "./importService";
import * as moment from "moment";
import PlayerLoginRecord from "../database/models/playerLoginRecord";
import PlayerManager from "../player/player-manager";

// 玩家信息
export default class PlayerService extends BaseService {
  async getPlayerPlainModel(playerId: string): Promise<any> {
    // 将 model 转换为 plain 对象
    return Player.findById(playerId).lean().exec();
  }

  async getPlayerModel(playerId: string): Promise<any> {
    return Player.findById(playerId);
  }

  async getPlayerModelByShortId(shortId: number): Promise<any> {
    return Player.findOne({ shortId });
  }

  // 根据用户名获取玩家
  async getPlayerByName(name) {
    return Player.find({ name });
  }

  async findOrCreatePlayerByName(name) {
    const players = await this.getPlayerByName(name);
    if (players.length < 1) {
      return this.createNewPlayer({ name });
    }
    return players[0];
  }

  // 创建用户
  async createNewPlayer(opt) {
    const username = await this.generateUsername();
    const modelId = new mongoose.Types.ObjectId();
    return PlayerModel.create({
      _id: opt._id ? opt._id : modelId,
      name: opt.name ? opt.name : username,
      // 房卡
      gem: config.game.initModelGemCount,
      headImgUrl: opt.headImgUrl ? opt.headImgUrl : 'https://wx-remote.tianle.fanmengonline.com/defaultAvatar/man.png',
      sex: opt.sex || 1,
      gold: opt._id ? config.game.initModelGoldCount : 0,
      ruby: opt.ruby || config.game.initModelRuby,
      platform: opt.platform || '',
      luckyDraw: {
        date: new Date().toLocaleDateString(),
        time: 1,
      },
      phone: opt.phoneNum || '',
      isTourist: !opt._id,
      openId: opt.openId || '',
      miniOpenid: opt.miniOpenid || '',
      appleId: opt.appleId || '',
      shortId: await getNewShortPlayerId(),
      inviteCode: await getNewPlayerInviteCode(),
      sessionKey: opt.sessionKey || '',
    })
  }

  // 生成随机用户名
  async generateUsername() {
    const lastName = faker.name.lastName();
    return lastName.toLowerCase();
  }

  // 获取机器人
  async getRobot(categoryId) {
    // 金豆
    const rubyRequired = await service.gameConfig.getPublicRoomCategoryByCategory(categoryId);
    if (!rubyRequired) {
      throw new Error('房间错误')
    }
    // 最高为随机下限的 20% - 30%
    const rand = service.utils.randomIntBetweenNumber(2, 3) / 10;
    const max = rubyRequired.minAmount + Math.floor(rand * (rubyRequired.maxAmount - rubyRequired.minAmount));
    const ruby = service.utils.randomIntBetweenNumber(rubyRequired.minAmount, max);
    const result = await Player.aggregate([
      {$match: { platform: 'robot' }},
      {$sample: { size: 1}}
    ]);
    const randomPlayer = await this.getPlayerModel(result[0]._id);
    // 重新随机设置 ruby
    randomPlayer.ruby = ruby;
    await randomPlayer.save();
    return randomPlayer;
  }

  async logOldGemConsume(playerId, note, gem) {
    new ConsumeRecord({
      player: playerId,
      note,
      createAt: new Date(),
      gem,
    }).save();
  }

  // 记录房卡消耗
  async logGemConsume(playerId, type, amount, totalAmount, note) {
    await DiamondRecord.create({
      player: playerId,
      amount,
      residue: totalAmount,
      type,
      note,
      createAt: new Date(),
    })
  }

  // 根据邀请码获取用户
  async getPlayerByInviteCode(inviteCode: number) {
    const result = await Player.findOne({inviteCode});
    if (result) {
      return result;
    }
    return null;
  }

  async getLocation(user_ip, current_ip) {
    if (!user_ip) {
      user_ip = current_ip;
    }

    const res = await service.base.curl(`https://ipcity.market.alicloudapi.com/ip/city/query?ip=${user_ip}`, {
      method: "get",
      headers: {
        Authorization: "APPCODE " + config.ipConfig.appCode
      }
    });

    return JSON.parse(res.data);
  }

  async checkUserRegist(user, data) {
    if (user) {
      const playerManager = PlayerManager.getInstance();
      // 检查重复登录
      await this.checkIsLogging(user._id.toString());
      // 处理正在登录
      playerManager.addLoggingInPlayer(user._id.toString());

      // 判断昨日是否登录
      const start = moment().subtract(1, 'day').startOf('day').toDate();
      const end = moment().subtract(1, 'day').endOf('day').toDate();
      const today_start = moment(new Date()).startOf('day').toDate();
      const today_end = moment(new Date()).endOf('day').toDate();
      const yestodayLoginCount = await PlayerLoginRecord.count({createAt:
            {$gte: start, $lt: end}, playerId: user._id.toString()});
      const todayLoginCount = await PlayerLoginRecord.count({createAt:
            {$gte: today_start, $lt: today_end}, playerId: user._id.toString()});
      if(yestodayLoginCount === 0) {
        user.consecutiveLoginDays = 1;
      }
      if (yestodayLoginCount > 0 && todayLoginCount === 0) {
        user.consecutiveLoginDays++;
      }

      // 判断是否有省市ip信息
      if (!user.province || !user.city) {
        const result = await this.getLocation(user.ip, data.ip);
        if (result.code === 200) {
          user.province = result.data.result.prov;
          user.city = result.data.result.city;
        }
      }

      await user.save();

      if (todayLoginCount === 0) {
        await PlayerLoginRecord.create({
          playerId: user._id.toString(),
          shortId: user.shortId
        })
      }
    } else {
      const result = await this.getLocation(null, data.ip);
      if (result.code === 200) {
        data["province"] = result.data.result.prov;
        data["city"] = result.data.result.city;
      }
      user = await Player.create(data);
      const playerManager = PlayerManager.getInstance();
      // 检查重复登录
      await this.checkIsLogging(user._id.toString());
      // 处理正在登录
      playerManager.addLoggingInPlayer(user._id.toString());

    }

    return await Player.findOne({_id: user._id}).lean();
  }

  // 检查重复登录
  async checkIsLogging(playerId) {
    const playerManager = PlayerManager.getInstance();
    const oldPlayer = playerManager.getPlayer(playerId);
    if (oldPlayer) {
      // 下线旧账号
      await oldPlayer.disconnect();
      playerManager.removePlayer(playerId);
      return { isFinish: false };
    }
    return { isFinish: false };
  }
}
