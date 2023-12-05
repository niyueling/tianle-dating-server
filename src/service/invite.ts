import {InviteActionType, RedisKey, WithdrawStatus} from "@fm/common/constants";
import {GameError} from "@fm/common/errors";
import * as moment from "moment/moment";
import Player from "../database/models/player";
import PlayerInvite from "../database/models/playerInvite";
import PlayerInviteBalance from "../database/models/playerInviteBalance";
import PlayerInviteOrder from "../database/models/playerInviteOrder";
import PlayerInvitePeople from "../database/models/playerInvitePeople";
import PlayerInviteWithdrawOrder from "../database/models/playerInviteWithdrawOrder";
import PlayerRankLottery from "../database/models/playerRankLottery";
import RankConfig from "../database/models/rankConfig";
import createClient from "../utils/redis";
import BaseService from "./base";
import {service} from "./importService";

// 升级条件
const levelConf = {
  1: {
    // 升级邀请人数
    upgrade: 1,
    // 保级人数
    relegation: 1,
    // 未达到保级收益
    halfPercent: 0.05,
    // 10% 收益
    percent: 0.1,
  },
  2: {
    // 升级邀请人数
    upgrade: 10,
    // 保级人数
    relegation: 3,
    // 未达到保级收益
    halfPercent: 0.075,
    // 收益
    percent: 0.15,
  },
  3: {
    // 升级邀请人数
    upgrade: 33,
    // 保级人数
    relegation: 8,
    // 未达到保级收益
    halfPercent: 0.1,
    // 收益
    percent: 0.2,
  },
  // 金牌
  4: {
    // 升级邀请人数
    upgrade: 66,
    // 保级人数
    relegation: 16,
    // 未达到保级收益
    halfPercent: 0.15,
    // 10% 收益
    percent: 0.3,
  },
}

// 排行榜抽奖
const rankTimes = {
  // 第几名: 抽奖次数
  1: 9,
  2: 8,
  3: 7,
  4: 6,
  5: 5,
  6: 4,
  7: 3,
  8: 2,
  9: 1,
  10: 1,
}

// 邀请
export default class InviteService extends BaseService {

  getRelegation(level) {
    if (levelConf[level]) {
      return levelConf[level].relegation;
    }
    return 0;
  }

  // 升级需要人数
  getUpgradeCount(level) {
    if (levelConf[level + 1]) {
      return levelConf[level + 1].upgrade;
    }
    // 满级
    return 0;
  }
  // 根据邀请码获取用户
  async getPlayerByInviteCode(inviteCode: number) {
    const result = await Player.findOne({inviteCode});
    if (result) {
      return result;
    }
    return null;
  }

  async mustGetPlayerByInviteCode(inviteCode) {
    const result = await Player.findOne({inviteCode});
    if (!result) {
      throw new GameError('用户不存在');
    }
    return result;
  }

  // 用户是否已经被邀请
  async isPlayerInvited(inviteeShortId) {
    const person = await PlayerInvitePeople.findOne({ inviteeShortId });
    return !!person;
  }

  // 绑定邀请码
  async inviteByCode(inviteCode, inviteePlayerId, inviteeShortId) {
    const inviter = await this.getPlayerByInviteCode(inviteCode);
    if (!inviter) {
      return false;
    }
    return PlayerInvitePeople.create({
      playerId: inviter._id,
      shortId: inviter.shortId,
      inviteCode: inviter.inviteCode,
      inviteePlayerId,
      inviteeShortId,
      isBuy: false,
      firstPayAt: new Date(),
    })
  }

  // 本月邀请人数
  async countThisMonthInvitee(inviteCode) {
    return this.countMonthInvitee(inviteCode, moment());
  }
  //
  // // 上月邀请人数
  // async countLastMonthInvitee(inviteCode) {
  //   const lastMonth = moment().startOf('month').subtract(1, 'month');
  //   return this.countMonthInvitee(inviteCode, lastMonth);
  // }

  // 统计某月邀请人数
  async countMonthInvitee(inviteCode, startMoment) {
    const startAt = startMoment.clone().startOf('month').startOf('day').toDate();
    const endAt = startMoment.clone().endOf('month').endOf('day').toDate();
    const result = await this.validInviteeByTime(inviteCode, startAt, endAt);
    return result.length;
  }

  // 一段时间内的被邀请人
  async validInviteeByTime(inviteCode, startAt, endAt) {
    return PlayerInvitePeople.find({
      inviteCode,
      isBuy: true,
      firstPayAt: {
        $gte: startAt,
        $lte: endAt,
      }
    })
  }

  // 邀请配置
  async getOrCreateInviterConf(inviteCode) {
    const inviter = await this.mustGetPlayerByInviteCode(inviteCode);
    const conf = await PlayerInvite.findOne({ inviteCode });
    if (conf) {
      return conf;
    }
    return PlayerInvite.create({
      playerId: inviter._id,
      shortId: inviter.shortId,
      inviteCode,
      downgradeAt: new Date(),
      upgradeAt: new Date(),
      lastWithdrawAt: new Date(),
      balance: 0,
      level: 0,
      totalInvite: 0,
    })
  }

  // 更新等级
  async updateLevel(inviteData) {
    const now = moment();
    const lastDowngradeAt = moment(inviteData.downgradeAt).startOf('month');
    const month = now.clone().startOf('month').diff(lastDowngradeAt, 'month');
    if (month > 0) {
      // 有 n 个月没做任务了
      for (let i = 0; i < month; i++) {
        const checkDate = lastDowngradeAt.add(1, 'month');
        // 先检查要不要降级
        await this.downgradeLevel(inviteData, checkDate);
        // 再检查本月要不要升级
        await this.upgradeLevel(inviteData, checkDate)
      }
    } else {
      // 本月是否要升级
      await this.upgradeLevel(inviteData, now);
    }
    await inviteData.save();
  }

  // 降级
  async downgradeLevel(inviteData, checkMonthMoment) {
    const currentLevelConf = levelConf[inviteData.level];
    if (currentLevelConf) {
      // 等级不为0, 可以降级
      if (inviteData.downgradeAt.getTime() < checkMonthMoment.clone().startOf('month').toDate().getTime()) {
        // 这个月还没开始降级, 检查保级条件
        const lastInvitee = await this.countMonthInvitee(inviteData.inviteCode, checkMonthMoment);
        if (lastInvitee < currentLevelConf.relegation) {
          // 上个月没有达到保级条件·
          inviteData.level--;
          // 更新勋章
          await service.medal.updateInviteMedal(inviteData.playerId, inviteData.shortId, inviteData.level);
        }
        // 更新降级检查时间
        inviteData.downgradeAt = checkMonthMoment.toDate();
      }
    }
  }

  // 升级
  async upgradeLevel(inviteData, checkMonthMoment) {
    const currentInvitee = await this.countMonthInvitee(inviteData.inviteCode, checkMonthMoment);
    if (currentInvitee > 0) {
      // 这个月有邀请, 检查是否需要升级
      const nextLevelConf = levelConf[inviteData.level + 1];
      if (nextLevelConf && currentInvitee >= nextLevelConf.upgrade) {
        // 未满级且达到升级条件
        inviteData.level++;
        inviteData.upgradeAt = checkMonthMoment.toDate();
        // 更新勋章
        await service.medal.updateInviteMedal(inviteData.playerId, inviteData.shortId, inviteData.level);
      }
    }
  }

  // 获取等级收益百分比
  async getPercent(inviteData) {
    // 先检查要不要升级
    await this.updateLevel(inviteData);
    // 收益是否减半
    const percentConf = levelConf[inviteData.level];
    let percent = 0;
    if (!percentConf) {
      // 0级
      return { percent, level: 0};
    }
    const lastUpgradeAt = moment(inviteData.upgradeAt).startOf('month');
    const month = moment().startOf('month').diff(lastUpgradeAt, 'month');
    if (month > 1) {
      // 超过一个月了， 检查有没有达到保级条件
      const lastInvitee = await this.countMonthInvitee(inviteData.inviteCode, moment());
      if (lastInvitee < percentConf.relegation) {
        // 没达到
        percent = percentConf.halfPercent;
      } else {
        // 保级成功
        percent = percentConf.percent;
      }
    } else {
      // 刚升级， 不减半
      percent = percentConf.percent;
    }
    return { percent, level: inviteData.level };
  }

  // 记录邀请人收益
  async addInviteeOrder(inviteePlayerId, orderId, payPrice) {
    // 查找受益人
    const inviter = await PlayerInvitePeople.findOne({ inviteePlayerId })
    if (!inviter) {
      // 没有此人
      return false;
    }
    let isNew = false;
    if (!inviter.isBuy) {
      isNew = true;
      inviter.isBuy = true;
      inviter.firstPayAt = new Date();
    }
    await inviter.save();
    const inviteData = await this.getOrCreateInviterConf(inviter.inviteCode);
    const { percent, level } = await this.getPercent(inviteData);
    // 创建收益订单
    const order = await PlayerInviteOrder.create({
      playerId: inviter.playerId,
      shortId: inviter.shortId,
      inviteePlayerId: inviter.inviteePlayerId,
      inviteeShortId: inviter.inviteeShortId,
      orderId,
      payPrice,
      inviteLevel: level,
      invitePercent: percent,
    });
    // 添加收益
    const profit = Math.floor(percent * payPrice);
    await this.updateInviteBalance(inviteData, InviteActionType.chargeProfit, profit, '充值分成', isNew, order._id);
    // 更新排行榜
    await this.updateRank(inviter.playerId);
  }

  // 更新邀请余额
  async updateInviteBalance(inviteData, actionType: InviteActionType, amount, comment, isAddInviteeCount, orderId?) {
    // 记录余额操作
    const order = await PlayerInviteBalance.create({
      playerId: inviteData.playerId,
      shortId: inviteData.shortId,
      amount,
      actionType,
      comment: comment || '',
      orderId: orderId || null,
    });
    const lock = await service.utils.grantLockOnce(RedisKey.inviteBalance + inviteData.shortId, 5);
    if (!lock) {
      this.logger.error(`update invite balance fail shortId ${inviteData.shortId}, actionType ${actionType} amount ${amount} orderId ${orderId}`);
      // 删除操作记录
      await order.remove();
      return false;
    }
    inviteData.balance += amount;
    if (isAddInviteeCount) {
      inviteData.totalInvite++;
    }
    await inviteData.save();
    await lock.unlock();
    return true;
  }

  // 创建提现订单
  async createWithdrawOrder(playerId, shortId, payPrice) {
    return PlayerInviteWithdrawOrder.create({
      playerId,
      shortId,
      payPrice,
      status: WithdrawStatus.pending,
    })
  }

  // 生成邀请排行榜
  async buildRank(startAt, endAt, rankId, lastId?) {
    let list;
    const client = createClient();
    // 格式 2023-03-07/2023-03-09/rankId
    const rankName = this.rankName(startAt, endAt, rankId);
    if (lastId) {
      list = await PlayerInvitePeople
        .find({
          isBuy: true,
          firstPayAt: {
            $gte: startAt,
            $lte: endAt,
          },
          _id: {
            $lt: lastId,
          }
        })
        .limit(1000)
        .sort({ _id: -1});
    } else {
      // 初始化 redis key
      await client.delAsync(rankName);
      list = await PlayerInvitePeople
        .find({
          isBuy: true,
          firstPayAt: {
            $gte: startAt,
            $lte: endAt,
          },
        })
        .limit(1000)
        .sort({ _id: -1});
    }
    for (const record of list) {
      // 向排行榜添加邀请人数
      // @ts-ignore
      await client.zincrbyAsync(rankName, 1, record.playerId);
    }
    if (list.length === 1000) {
      // 还有记录
      lastId = list.pop()._id;
      return this.buildRank(startAt, endAt, lastId)
    }
  }

  async initRank(rankId?) {
    const lock = await service.utils.grantLockOnce(RedisKey.initRank, 3600);
    if (!lock) {
      console.error('get init rank lock fail');
      return;
    }
    if (rankId) {
      const rank = await RankConfig.findById(rankId);
      if (rank) {
        await this.buildRank(rank.startTime, rank.endTime, rank._id);
      }
      return lock.unlock();
    }
    const rankList = await this.getValidRankList();
    for (const rank of rankList) {
      await this.buildRank(rank.startTime, rank.endTime, rank._id);
    }
    return lock.unlock();
  }

  // 获取运行中的
  async getValidRankList() {
    const now = new Date();
    return RankConfig.find({
      isOpen: true,
      startTime: {
        // 已开始
        $lte: now,
      },
      endTime: {
        // 未结束
        $gte: now,
      }
    })
  }

  // 排行榜是否开放
  async isRankOpen(rankId) {
    const rank = await RankConfig.findById(rankId);
    if (!rank || !rank.isOpen) {
      // 未开放
      return false;
    }
    const nowTime = new Date().getTime();
    return nowTime >= rank.startTime.getTime() && nowTime <= rank.endTime.getTime();
  }

  async isRankOpenByModel(rank) {
    if (!rank || !rank.isOpen) {
      // 未开放
      return false;
    }
    const nowTime = new Date().getTime();
    return nowTime >= rank.startTime.getTime() && nowTime <= rank.endTime.getTime();
  }

  // 更新排行榜
  async updateRank(playerId) {
    const rankList = await this.getValidRankList();
    for (const rank of rankList) {
      await this._updateRank(rank.startTime, rank.endTime, rank._id, playerId);
    }
  }

  async _updateRank(startAt, endAt, rankId, playerId) {
    const client = createClient();
    const rankName = this.rankName(startAt, endAt, rankId);
    const isOpen = await this.isRankOpen(rankId);
    if (!isOpen) {
      // 排行榜未开放
      console.error('rank no open ' + rankId)
      return false;
    }
    // @ts-ignore
    return client.zincrbyAsync(rankName, 1, playerId);
  }

  // 结算排行榜, TODO 并列排名
  async settleRankPrize() {
    const lock = await service.utils.grantLockOnce(RedisKey.settleRank, 3600);
    if (!lock) {
      // 上次的还没处理完
      console.error('grant lock for rank prize fail');
      return;
    }
    const client = createClient();
    const list = await RankConfig.find({
      // 已上架
      isOpen: true,
      // 未结算
      isSettle: false,
      // 时间已结束
      endTime: {
        $lt: new Date(),
      }
    })
    for (const rank of list) {
      const rankName = this.rankName(rank.startTime, rank.endTime, rank._id);
      // @ts-ignore
      const isOk = await client.existsAsync(rankName);
      if (!isOk) {
        // 生成 rank
        await this.initRank(rank._id);
      }
      // 记录所有排名
      // @ts-ignore
      const result = await client.zrevrangeAsync(rankName, 0, -1, 'WITHSCORES');
      // console.log('list', rankName, JSON.stringify(result))
      for (let i = 0; i < result.length;  i += 2) {
        // 第一个是 playerId，第二个是邀请人数
        const playerId = result[i];
        const inviteCount = parseInt(result[i + 1], 10);
        await this.createOrUpdateRankRecord(playerId, rank._id, (i / 2) + 1, inviteCount);
      }
      rank.isSettle = true;
      rank.settleAt = new Date();
      await rank.save();
    }
    return lock.unlock();
  }

  // 记录排行榜
  async createOrUpdateRankRecord(playerId, rankId, degree, inviteCount) {
    const player = await service.playerService.getPlayerModel(playerId);
    if (!player) {
      // 用户不存在
      console.error('no player to record rank' + playerId );
      return;
    }
    let model = await PlayerRankLottery.findOne({
      shortId: player.shortId,
      rankId,
    });
    const times = rankTimes[degree] || 0;
    if (!model) {
      model = await PlayerRankLottery.create({
        playerId: player._id,
        shortId: player.shortId,
        degree,
        times,
        createAt: new Date(),
        rankId,
        inviteCount,
      })
    } else {
      model.degree = degree;
      model.inviteCount = inviteCount;
      model.times = times;
      await model.save();
    }
    return model;
  }

  async cleanRank() {
    const list = await RankConfig.find();
    for (const rank of list) {
      await createClient().delAsync(this.rankName(rank.startTime, rank.endTime, rank._id));
    }
  }

  rankName(startAt, endAt, rankId) {
    return RedisKey.inviteRank + startAt.toLocaleDateString() + '/' + endAt.toLocaleDateString() + '/' + rankId;
  }

  // 获取排名
  async getRankDegreeByPlayerId(playerId, rankId) {
    const rank = await RankConfig.findById(rankId);
    if (!rank) {
      return { degree: -1, inviteCount: 0 };
    }
    // 查找结算记录
    const playerRank = await service.lottery.getPlayerRankLotteryByPlayerId(playerId, rankId);
    if (playerRank) {
      return { degree: playerRank.degree, inviteCount: playerRank.inviteCount };
    }
    // 查找 redis 中的实时排名
    // @ts-ignore
    const index = await createClient().zrevrankAsync(this.rankName(rank.startTime, rank.endTime, rank._id), playerId)
    if (index !== null) {
      // 查找分值
      // @ts-ignore
      const score = await createClient().zscoreAsync(this.rankName(rank.startTime, rank.endTime, rank._id), playerId)
      return { degree: index + 1, inviteCount: parseInt(score, 10) };
    }
    // 没有名次
    return { degree: -1, inviteCount: 0 };
  }

  // 根据第几名获取用户
  async getPlayerByRankDegree(degree, rankId) {
    const rank = await RankConfig.findById(rankId);
    if (!rank) {
      return null;
    }
    if (rank.isSettle) {
      // 已经结算,从数据中查
      const model = await PlayerRankLottery.findOne({
        rankId: rank._id,
        degree,
      })
      return model && model.playerId || null;
    }
    // @ts-ignore
    const result = await createClient().zrevrangeAsync(
      this.rankName(rank.startTime, rank.endTime, rank._id),
      degree - 1, degree - 1
    );
    if (result.length > 0) {
      return result[0];
    }
    return null;
  }

  // 根据排名范围获取排行榜
  async getPlayerByRankDegreeRange(minDegree, maxDegree, rankId) {
    const rank = await RankConfig.findById(rankId);
    if (!rank) {
      return [];
    }
    if (rank.isSettle) {
      // 已经结算了, 从数据库中找前 100 名
      const rankList = await PlayerRankLottery.find({
        rankId: rank._id,
      }).sort({ degree: -1 }).limit(100);
      const list = [];
      for (const r of rankList) {
        list.push({
          playerId: r.playerId,
          // 邀请人数
          inviteCount: r.inviteCount,
        })
      }
      return list;
    }
    // 未结算
    // @ts-ignore
    const result = await createClient().zrevrangeAsync(
      this.rankName(rank.startTime, rank.endTime, rank._id),
      minDegree - 1, maxDegree - 1
    );
    if (result.length > 0) {
      const list = [];
      for (let i = 0; i < result.length; i += 2) {
        list.push({
          playerId: result[i],
          inviteCount: parseInt(result[i + 1], 10),
        })
      }
      return list;
    }
    return [];
  }
}
