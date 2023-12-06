import {InviteActionType, RedisKey, WithdrawStatus} from "@fm/common/constants";
import {GameError} from "@fm/common/errors";
import * as moment from "moment";
import Player from "../../database/models/player";
import PlayerInviteOrder from "../../database/models/playerInviteOrder";
import PlayerInvitePeople from "../../database/models/playerInvitePeople";
import RankConfig from "../../database/models/rankConfig";
import {accMul} from "../../utils/algorithm";
import {addApi, BaseApi} from "./baseApi";

// 邀请
export class InviteApi extends BaseApi {

  // 绑定邀请人
  @addApi({
    rule: {
      // 邀请码
      inviteCode: 'string'
    }
  })
  async inviteByCode(message) {
    const inviteCode = parseInt(message.inviteCode, 10);
    const isExist = await this.service.invite.getPlayerByInviteCode(inviteCode);
    if (!isExist || inviteCode === this.player.model.inviteCode) {
      throw new GameError('邀请码错误');
    }
    const isInvited = await this.service.invite.isPlayerInvited(this.player.model.shortId);
    if (isInvited) {
      throw new GameError('已绑定邀请码')
    }
    await this.service.invite.inviteByCode(inviteCode, this.player.model._id, this.player.model.shortId);
    this.replySuccess();
  }

  // 提现
  @addApi({
    rule: {
      // 提现金额
      amount: 'number'
    }
  })
  async withdraw(message) {
    const lock = await this.service.utils.grantLockOnce(RedisKey.inviteWithdraw + this.player.model.shortId, 3);
    if (!lock) {
      return this.replyFail('提现失败，请稍后重试')
    }
    const now = moment();
    if (now.weekday() !== 1) {
      return this.replyFail('请在每周一提现')
    }
    const amount = accMul(message.amount, 100);
    const inviteData = await this.service.invite.getOrCreateInviterConf(this.player.model.inviteCode);
    if (inviteData.balance < amount) {
      await lock.unlock();
      return this.replyFail('余额不足')
    }
    const withdrawOrder = await this.service.invite.createWithdrawOrder(this.player.model._id,
      this.player.model.shortId, amount);
    const isOk = await this.service.invite.updateInviteBalance(inviteData, InviteActionType.withdraw, -amount,     '用户提现',
      false, withdrawOrder._id)
    if (!isOk) {
      await withdrawOrder.remove();
      await lock.unlock();
      return this.replyFail('提现失败，请稍后重试');
    }
    const result = await this.service.wechatPay.transferToOneUser(withdrawOrder._id.toString(), '天乐麻将邀请收益提现', '天乐麻将邀请收益提现',
      amount, this.player.model.openId)
    // TODO check withdraw status
    this.logger.info('withdraw result', JSON.stringify(result));
    withdrawOrder.status = WithdrawStatus.success;
    await withdrawOrder.save();
    return lock.unlock();
  }

  // 我的邀请信息
  @addApi()
  async myInviteInfo() {
    const inviteData = await this.service.invite.getOrCreateInviterConf(this.player.model.inviteCode);
    const result = await this.service.invite.getPercent(inviteData);
    await inviteData.save();
    const monthInvitee = await this.service.invite.countThisMonthInvitee(this.player.model.inviteCode);
    return this.replySuccess({
      // 等级
      level: inviteData.level,
      inviteCode: inviteData.inviteCode,
      // 余额
      balance: inviteData.balance,
      // 收益率
      percent: result.percent,
      // 已邀请人数
      completeInvitee: monthInvitee,
      // 保级人数
      relegationInvitee: this.service.invite.getRelegation(inviteData.level),
      // 升级人数， 满级为0
      nextLevelInvitee: this.service.invite.getUpgradeCount(inviteData.level),
    })
  }

  // 收益列表
  @addApi({
    rule: {
      // 上页最后一个 _id
      nextId: {
        required: false,
        type: 'string',
      },
      // 每页数量
      limit: {
        required: false,
        type: 'number',
      }
    }
  })
  async getProfitList(message) {
    // 默认10页
    const limit = message.limit || 10;
    const count = await PlayerInviteOrder.count({ shortId: this.player.model.shortId });
    let records;
    if (message.nextId) {
      records = await PlayerInviteOrder.find({
        _id: {
          $lt: message.nextId,
        },
        shortId: this.player.model.shortId,
      }).limit(limit).sort({ _id: -1 })
    } else {
      records = await PlayerInviteOrder.find({
        shortId: this.player.model.shortId,
      }).limit(limit).sort({ _id: -1 })
    }
    const resp = [];
    for (const r of records) {
      const player = await Player.findById(r.inviteePlayerId);
      if (!player) {
        continue;
      }
      resp.push({
        _id: r._id,
        // 充值时间
        createAt: r.createAt,
        // 被邀请人
        inviteeName: player.name,
        inviteeShortId: r.inviteeShortId,
        // 充值金额
        payPrice: r.payPrice,
        // 充值收益率
        percent: r.invitePercent,
        // 单笔收益
        profit: Math.floor(r.payPrice * r.invitePercent),
      })
    }
    this.replySuccess({ list: resp, count });
  }

  // 我的邀请列表
  @addApi({
    rule: {
      nextId: {
        required: false,
        type: 'string',
      },
      // 每页数量
      limit: {
        required: false,
        type: 'number',
      }
    }
  })
  async myInviteList(message) {
    // 默认10页
    const limit = message.limit || 10;
    const count = await PlayerInvitePeople.count({ shortId: this.player.model.shortId });
    let records;
    if (message.nextId) {
      records = await PlayerInvitePeople.find({
        _id: {
          $lt: message.nextId,
        },
        shortId: this.player.model.shortId,
      }).limit(limit).sort({ _id: -1 })
    } else {
      records = await PlayerInvitePeople.find({
        shortId: this.player.model.shortId,
      }).limit(limit).sort({ _id: -1 })
    }
    const resp = [];
    for (const r of records) {
      const player = await Player.findById(r.inviteePlayerId);
      if (!player) {
        continue;
      }
      resp.push({
        _id: r._id,
        // 邀请时间
        createAt: r.createAt,
        // 被邀请人
        inviteeName: player.name,
        inviteeShortId: r.inviteeShortId,
        // 是否首充
        isBuy: r.isBuy,
        // 首充时间
        firstPayAt: r.firstPayAt,
      })
    }
    // 首充统计
    const firstPayCount = await PlayerInvitePeople.count({ shortId: this.player.model.shortId, isBuy: true });
    this.replySuccess({ list: resp, count, firstPayCount });
  }

  // 获取排行榜
  @addApi({
    rule: {
      rankNo: {
        type: 'number',
        required: false,
      }
    }
  })
  async getInviteRank(message) {
    // 当前正在运行的排行榜
    let rank;
    let myRank = -1;
    let startTime = null;
    let endTime = null;
    let rankNo = -1;
    let rankId = null;
    let myInviteCount = 0;
    const info = [];
    if (!message.rankNo) {
      // 返回最新一期
      const rankList = await RankConfig.find().sort({ rankNo: -1}).limit(1);
      if (rankList.length === 1) {
        rank = rankList[0];
      }
    } else {
      // 根据 rankNo 获取
      rank = await RankConfig.findOne({ rankNo: message.rankNo });
    }
    if (rank) {
      // 返回前 10 名信息
      const result = await this.service.invite.getPlayerByRankDegreeRange(1, 10, rank._id);
      let model;
      for (const r of result) {
        model = await this.service.playerService.getPlayerModel(r.playerId);
        info.push({
          name: model.name,
          headImgUrl: model.headImgUrl,
          // 邀请人数
          inviteCount: r.inviteCount,
          shortId: model.shortId,
        })
      }
      // 自己的排名
      const res = await this.service.invite.getRankDegreeByPlayerId(this.player.model._id, rank._id);
      startTime = rank.startTime;
      endTime = rank.endTime;
      rankNo = rank.rankNo;
      rankId = rank._id;
      myRank = res.degree;
      myInviteCount = res.inviteCount;
    }
    this.replySuccess({ info, myRank, startTime, endTime, rankNo, rankId, myInviteCount });
  }
}
