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
import UserRechargeOrder from "../database/models/userRechargeOrder";
import {ConsumeLogType, TianleErrorCode} from "@fm/common/constants";
import GoldRecord from "../database/models/goldRecord";
import GoodsReviveRuby from "../database/models/goodsReviveRuby";
import GoodsModel from "../database/models/goods";
import HeadBorder from "../database/models/HeadBorder";
import PlayerHeadBorder from "../database/models/PlayerHeadBorder";
import Medal from "../database/models/Medal";
import PlayerMedal from "../database/models/PlayerMedal";
import CardTable from "../database/models/CardTable";
import PlayerCardTable from "../database/models/PlayerCardTable";

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
  async logGemConsume(playerId, type, amount, totalAmount, note, propId = null) {
    await DiamondRecord.create({
      player: playerId,
      amount,
      residue: totalAmount,
      type,
      note,
      propId,
      createAt: new Date(),
    })
  }

  // 记录金豆消耗
  async logGoldConsume(playerId, type, amount, totalAmount, note) {
    await GoldRecord.create({
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

      // 更新sessionKey
      user.sessionKey = data.sessionKey;

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

    // 判断是否分配默认牌桌
    const playerCardTableCount = await PlayerCardTable.count({playerId: user._id, propId: 1200});
    if (!playerCardTableCount) {
      await PlayerCardTable.create({
        playerId: user._id,
        shortId: user.shortId,
        propId: 1200,
        times: -1,
        isUse: true
      });
    }

    // 判断是否分配默认头像框
    const playerHeadBorderCount = await PlayerHeadBorder.count({playerId: user._id, propId: 1000});
    if (!playerHeadBorderCount) {
      await PlayerHeadBorder.create({
        playerId: user._id,
        shortId: user.shortId,
        propId: 1000,
        times: -1,
        isUse: true
      });
    }

    return await Player.findOne({_id: user._id}).lean();
  }

  // 检查重复登录
  async checkIsLogging(playerId) {
    try {
      const playerManager = PlayerManager.getInstance();
      const oldPlayer = playerManager.getPlayer(playerId);
      if (oldPlayer) {
        // 下线旧账号
        await oldPlayer.disconnect();
        playerManager.removePlayer(playerId);
        return { isFinish: false };
      }
      return { isFinish: false };
    } catch (e) {
      return { isFinish: false };
    }
  }

  async playerRecharge(orderId, thirdOrderNo) {
    const order = await UserRechargeOrder.findOne({_id: orderId});
    if (!order) {
      return false;
    }

    const user = await Player.findOne({_id: order.playerId});
    if (!user) {
      return false;
    }

    user.diamond += order.diamond;
    user.dominateCount = Math.floor(Math.random() * 5) + 1;
    await user.save();

    order.status = 1;
    order.transactionId = thirdOrderNo;
    await order.save();

    // 增加日志
    await this.logGemConsume(user._id, ConsumeLogType.chargeByWechat, order.diamond, user.diamond, "微信充值");

    return true;
  }

  async playerVoucherRecharge(orderId, thirdOrderNo) {
    const order = await UserRechargeOrder.findOne({_id: orderId});
    if (!order) {
      return false;
    }

    const user = await Player.findOne({_id: order.playerId});
    if (!user) {
      return false;
    }

    user.voucher += order.diamond;
    user.dominateCount = Math.floor(Math.random() * 5) + 1;
    await user.save();

    order.status = 1;
    order.transactionId = thirdOrderNo;
    await order.save();

    // 增加日志
    // await this.logGemConsume(user._id, ConsumeLogType.chargeByWechat, order.diamond, user.diamond, "微信充值");

    return true;
  }

  async receivePrize(prize, playerId, multiple = 1, type) {
    const user = await Player.findOne({_id: playerId});
    if (prize.type === 1) {
      user.diamond += prize.number * multiple;
      await service.playerService.logGemConsume(user._id, type, prize.number * multiple,
        user.diamond, `获得${prize.number * multiple}钻石`);
    }

    if (prize.type === 2) {
      user.gold += prize.number * multiple;
      await service.playerService.logGoldConsume(user._id, type, prize.number * multiple,
        user.gold, `获得${prize.number * multiple}金豆`);
    }

    if (prize.type === 3) {
      const config = await HeadBorder.findOne({propId: prize.propId}).lean();
      let playerHeadBorder = await PlayerHeadBorder.findOne({propId: prize.propId, playerId}).lean();

      // 如果头像框已过期，删除头像框
      if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
        await PlayerHeadBorder.remove({_id: playerHeadBorder._id});
        playerHeadBorder = null;
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

      // 如果用户已经拥有头像框，则在过期时间加上有效时间
      if (config && playerHeadBorder) {
        await PlayerHeadBorder.update({playerId: user._id, propId: prize.propId}, {$set: {times: prize.day !== -1 ? (playerHeadBorder.times + 1000 * 60 * 60 * 24 * prize.day) : -1}})
      }
    }

    if (prize.type === 4) {
      const config = await Medal.findOne({propId: prize.propId}).lean();
      let playerMedal = await PlayerMedal.findOne({propId: prize.propId, playerId}).lean();

      // 如果称号已过期，删除称号
      if (playerMedal && playerMedal.times !== -1 && playerMedal.times <= new Date().getTime()) {
        await PlayerMedal.remove({_id: playerMedal._id});
        playerMedal = null;
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

    if (prize.type === 5) {
      const config = await CardTable.findOne({propId: prize.propId}).lean();
      let playerCardTable = await PlayerCardTable.findOne({propId: prize.propId, playerId}).lean();

      // 如果称号已过期，删除称号
      if (playerCardTable && playerCardTable.times !== -1 && playerCardTable.times <= new Date().getTime()) {
        await playerCardTable.remove({_id: playerCardTable._id});
        playerCardTable = null;
      }

      if (config && !playerCardTable) {
        const data = {
          propId: prize.propId,
          playerId: user._id,
          shortId: user.shortId,
          times: -1,
          isUse: false
        }

        await PlayerCardTable.create(data);
      }

      // 如果用户已经拥有牌桌，则在过期时间加上有效时间
      if (config && playerCardTable) {
        await PlayerCardTable.update({playerId: user._id, propId: prize.propId}, {$set: {times: prize.day !== -1 ? (playerCardTable.times + 1000 * 60 * 60 * 24 * prize.day) : -1}})
      }
    }

    if (prize.type === 6) {
      user.helpCount += prize.number * multiple;
    }

    await user.save();
  }
}
