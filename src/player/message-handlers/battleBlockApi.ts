import {
  BlockBackPackType,
  BlockCurrencyType,
  BlockDiamondLogType,
  BlockFullUser,
  BlockOnlinePrizeType,
  BlockRoleUpgradeType,
  BlockSevenTaskType,
  BlockShopGiftType,
  BlockShopType,
  BlockSummonType,
  BlockTask as BlockTaskTypes,
  BlockTaskType,
  BlockTurntablePrizeType,
  ConsumeAmountType,
  GlobalConfigKeys,
  RedisKey,
  BlockErrorCode,
  UserRegistLocation
} from "@fm/common/constants";
import * as moment from "moment/moment";
import * as config from "../../config";
import * as mongoose from 'mongoose';
import {getBlockNewShortUserId} from "../../database/init";
import BlockBackPack from "../../database/models/blockBackPack";
import BlockDailySignPrize from "../../database/models/blockDailySignPrize";
import BlockDailySignPrizeRecord from "../../database/models/blockDailySignPrizeRecord";
import BlockDailySignTotalPrize from "../../database/models/blockDailySignTotalPrize";
import BlockDailySignTotalPrizeRecord from "../../database/models/blockDailySignTotalPrizeRecord";
import BlockDiamondRecord from "../../database/models/blockDiamondRecord";
import BlockLoginRecord from "../../database/models/blockLoginRecord";
import blockOnlinePrizeRecord from "../../database/models/blockOnlinePrizeRecord";
import BlockPassSectionRecord from "../../database/models/blockPassSectionRecord";
import BlockPrize from "../../database/models/blockPrize";
import BlockRole from "../../database/models/blockRole";
import BlockRoleBase from "../../database/models/blockRoleBase";
import BlockRoleSummon from "../../database/models/blockRoleSummon";
import BlockRoleSummonRecord from "../../database/models/blockRoleSummonRecord";
import BlockRoleUpgradeRecord from "../../database/models/blockRoleUpgradeRecord";
import BlockSevenSignPrize from "../../database/models/blockSevenSignPrize";
import BlockSevenSignPrizeRecord from "../../database/models/blockSevenSignPrizeRecord";
import BlockSevenTask from "../../database/models/blockSevenTask";
import BlockSevenTaskRecord from "../../database/models/blockSevenTaskRecord";
import BlockSevenTaskTotalPrize from "../../database/models/blockSevenTaskTotalPrize";
import BlockSevenTaskTotalPrizeRecord from "../../database/models/blockSevenTaskTotalPrizeRecord";
import BlockShop from "../../database/models/blockShop";
import BlockShopGiftLevel from "../../database/models/blockShopGiftLevel";
import BlockShopGiftPayRecord from "../../database/models/blockShopGiftPayRecord";
import BlockTask from "../../database/models/blockTask";
import BlockTaskRecord from "../../database/models/blockTaskRecord";
import BlockTaskTotalPrize from "../../database/models/blockTaskTotalPrize";
import BlockTaskTotalPrizeRecord from "../../database/models/blockTaskTotalPrizeRecord";
import BlockTurntablePrize from "../../database/models/blockTurntablePrize";
import BlockTurntablePrizeRecord from "../../database/models/blockTurntablePrizeRecord";
import BlockUser from "../../database/models/blockUser";
import {service} from "../../service/importService";
import {addApi, BaseApi} from "./baseApi";
import BlockSectionDetailRecord from "../../database/models/blockSectionDetailRecord";
import BlockWatchAdverRecord from "../../database/models/blockWatchAdverRecord";
import BlockWaveNumber from "../../database/models/blockWaveNumber";
import BlockWaveNumberRecord from "../../database/models/blockWaveNumberRecord";
import AlipaySdk from 'alipay-sdk';
import * as fs from "fs";
import BlockRoleResetRecord from "../../database/models/blockRoleResetRecord";
import BlockCurLevel from "../../database/models/blockCurLevel";
import BlockSectionRedPocketRecord from "../../database/models/blockSectionRedPocketRecord";
import BlockWithdrawConfig from "../../database/models/blockWithdrawConfig";
import BlockRedPocketWithdrawRecord from "../../database/models/blockRedPocketWithdrawRecord";
import BlockRedPocketRecord from "../../database/models/blockRedPocketRecord";

export class BattleBlockApi extends BaseApi {
  // 微信授权
  @addApi({
    rule: {
      code: 'string',
      location: "number?"
    }
  })
  async mnpLogin(message) {
    message.ip = this.player.getIpAddress();
    if (!message.location || message.location === UserRegistLocation.wechat) {
      const reply = await this.wxLogin(message);
      return this.replySuccess(reply);
    } else if (message.location === UserRegistLocation.aliGame) {
      const reply = await this.aliLogin(message);
      return this.replySuccess(reply);
    } else if (message.location === UserRegistLocation.app) {
      const reply = await this.appLogin(message);
      return this.replySuccess(reply);
    } else if (message.location === UserRegistLocation.qqGame) {
      const reply = await this.qqLogin(message);
      return this.replySuccess(reply);
    }
  }

  // 更新用户信息
  @addApi({
    rule: {
      openid: 'string?',
      shortId: 'number?',
      gem: 'number?',
      gold: 'number?',
      power: 'number?',
      hammerCount: 'number?',
      curLevel: 'number?',
      slotNum: 'number?',
      debrisId: 'number?',
      debrisNumber: 'number?',
      avatar: 'string?',
      nickname: 'string?',
      guideSteps: 'number?'
    }
  })
  async saveUserInfo(message) {
    let data = {};
    if(message.openid) {
      data["openid"] = message.openid;
    }
    if(message.shortId) {
      data["shortId"] = message.shortId;
    }

    const user = await BlockUser.findOne(data);

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (message.gem) {
      user.gem += message.gem;
    }

    if (message.gold) {
      user.gold += message.gold;
    }

    if (message.hammerCount) {
      user.hammerCount += message.hammerCount;
    }

    if (message.guideSteps) {
      user.guideSteps = message.guideSteps;
    }

    if (message.power) {
      if (message.power < 0 && user.power >= BlockFullUser.fullPower && user.power - message.power < BlockFullUser.fullPower) {
        user.updateTime = new Date().getTime();
      }

      user.power += message.power;
    }

    if (message.curLevel) {
      user.curLevel = message.curLevel;
    }

    if (message.slotNum) {
      user.slotNum = message.slotNum;
    }

    if (message.avatar) {
      user.avatar = message.avatar;
    }

    if (message.nickname) {
      user.nickname = message.nickname;
    }

    if (message.debrisId && message.debrisNumber) {
      const propInfo = await this.getBackPackInfo({propId: message.debrisId}, user);
      propInfo.number += message.debrisNumber;

      propInfo.save();
    }

    await user.save();

    const userInfo = user.toObject();
    const fulleUser = await this.getFullUserInfo(userInfo);

    return this.replySuccess(fulleUser);
  }

  // 碎片兑换角色
  @addApi({
    rule: {
      openid: 'string',
      debrisId: 'number',
      debrisNumber: 'number',
      roleId: 'number',
      type: "number"
    }
  })
  async debrisConversionRole(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const propInfo = await this.getBackPackInfo({propId: message.debrisId}, user);
    if (propInfo.number < message.debrisNumber) {
      return this.replyFail(BlockErrorCode.debrisInsufficient);
    }

    const roleInfo = await BlockRole.findOne({roleId: message.roleId, shortId: user.shortId});
    if (roleInfo) {
      return this.replyFail(BlockErrorCode.roleIsExist);
    }

    propInfo.number -= message.debrisNumber;
    propInfo.save();

    const roleData = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      roleId: message.roleId,
      level: 1,
      type: message.type
    }

    const record = await BlockRole.create(roleData);

    return this.replySuccess({debris: propInfo, role: record});
  }

  // 角色升级，使用金币
  @addApi({
    rule: {
      openid: 'string',
      roleId: 'number',
      gold: 'number'
    }
  })
  async upgradeRoleLevel(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }
    if (user.gold < message.gold) {
      return this.replyFail(BlockErrorCode.goldInsufficient);
    }

    const roleInfo = await BlockRole.findOne({playerId: user._id.toString(), roleId: message.roleId});
    if (!roleInfo) {
      return this.replyFail(BlockErrorCode.roleNotFound);
    }

    user.gold -= message.gold;
    user.save();

    roleInfo.level ++;
    roleInfo.save();

    await BlockRoleUpgradeRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      type: 1,
      roleType: roleInfo.type
    })

    const userInfo = user.toObject();
    const fulleUser = await this.getFullUserInfo(userInfo);

    return this.replySuccess(fulleUser);
  }

  // 角色升阶，使用碎片
  @addApi({
    rule: {
      openid: 'string',
      roleId: 'number',
      debrisId: 'number',
      debrisNumber: 'number',
      upgradeType: "number"
    }
  })
  async upgradeRoleQuality(message) {
    const user = await BlockUser.findOne({openid: message.openid}).lean();

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const roleInfo = await BlockRole.findOne({playerId: user._id.toString(), roleId: message.roleId});
    if (!roleInfo) {
      return this.replyFail(BlockErrorCode.roleNotFound);
    }

    const propInfo = await this.getBackPackInfo({propId: message.debrisId}, user);
    if (propInfo.number < message.debrisNumber) {
      return this.replyFail(BlockErrorCode.debrisInsufficient);
    }

    propInfo.number -= message.debrisNumber;
    propInfo.save();

    await BlockRoleUpgradeRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      type: 2,
      roleType: roleInfo.type
    })

    if (message.upgradeType === BlockRoleUpgradeType.ascendStairs) {
      if (roleInfo.qualityStar === 5) {
        return this.replyFail(BlockErrorCode.trayStarLimit);
      }
      roleInfo.qualityStar++;
      roleInfo.save();
    }

    if (message.upgradeType === BlockRoleUpgradeType.breakThrough) {
      if (roleInfo.qualityStar !== 5) {
        return this.replyFail(BlockErrorCode.trayStarInvalid);
      }
      roleInfo.qualityLevel ++;
      roleInfo.qualityStar = 1;
      roleInfo.save();
    }

    const fulleUser = await this.getFullUserInfo(user);

    return this.replySuccess(fulleUser);
  }

  // 角色上下阵
  @addApi({
    rule: {
      openid: 'string',
      roleId: 'number',
      selected: 'number?'
    }
  })
  async upgradeRoleBattleType(message) {
    const user = await BlockUser.findOne({openid: message.openid}).lean();

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const roleInfo = await BlockRole.findOne({playerId: user._id.toString(), roleId: message.roleId});
    if (!roleInfo) {
      return this.replyFail(BlockErrorCode.roleNotFound);
    }

    roleInfo.selected = message.selected;
    roleInfo.save();

    const fulleUser = await this.getFullUserInfo(user);

    return this.replySuccess(fulleUser);
  }

  // 更新在线时长
  @addApi({
    rule: {
      openid: 'string',
      activityTimes: "number"
    }
  })
  async updateActivityTimes(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (message.activityTimes) {
      user.activityTimes += message.activityTimes;
    }

    await user.save();

    return this.replySuccess({activityTimes: user.activityTimes});
  }

  // 获取在线时长
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async getActivityTimes(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    return this.replySuccess({activityTimes: user.activityTimes});
  }

  // 获取用户信息
  @addApi({
    rule: {
      openid: 'string?',
      shortId: 'number?'
    }
  })
  async getUserInfo(message) {
    let data = {};
    if (!message.openid && !message.shortId) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (message.openid) {
      data["openid"] = message.openid;
    }

    if (message.shortId) {
      data["shortId"] = message.shortId;
    }

    const user = await BlockUser.findOne(data).lean();

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const fulleUser = await this.getFullUserInfo(user);

    return this.replySuccess(fulleUser);
  }

  // 获取活动开关
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async getLoginActivity(message) {
    const user = await BlockUser.findOne({openid: message.openid}).lean();

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const activity = await this.getActivityInfo(user);

    return this.replySuccess(activity);
  }

  // 在线奖励列表
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async prizeLists(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const datas = await this.getOnlinePrizeLists(user);

    return this.replySuccess(datas);
  }

  // 领取在线奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async receiveOnlinePrize(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await BlockPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await blockOnlinePrizeRecord.findOne({shortId: user.shortId, "prizeConfig.times": prizeInfo.times});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receivePrize(prizeInfo, user, BlockDiamondLogType.giveByOnline, message.multiple);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    await blockOnlinePrizeRecord.create(data);

    return this.replySuccess(data);
  }

  // 7日登录列表
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async sevenSignLists(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const data = await this.getSevenSignLists(user);

    return this.replySuccess(data);
  }

  // 领取7日登录奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async sevenSignIn(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 兼容旧版本
    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取奖励配置
    const prizeInfo = await BlockSevenSignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    // 判断是否领取
    const receive = await BlockSevenSignPrizeRecord.findOne({shortId: user.shortId, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receivePrize(prizeInfo, user, BlockDiamondLogType.giveBySevenLogin, message.multiple);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      multiple: message.multiple,
      createAt: new Date()
    };

    await BlockSevenSignPrizeRecord.create(data);

    return this.replySuccess(data);
  }

  // 7日狂欢任务列表
  @addApi({
    rule: {
      openid: 'string',
      taskType: 'number',
      day: 'number',
    }
  })
  async sevenTaskLists(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const taskList = await this.getSevenTaskList(message, user);

    return this.replySuccess(taskList);
  }

  // 领取7日狂欢任务奖励
  @addApi({
    rule: {
      openid: 'string',
      taskId: 'number',
      taskType: 'number',
      day: 'number',
      multiple: 'number?'
    }
  })
  async finishSevenTask(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (!message.multiple) {
      message.multiple = 1;
    }

    // 获取任务配置
    const taskInfo = await BlockSevenTask.findOne({taskId: message.taskId}).lean();
    if (!taskInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    // 根据不同任务类型判断是否完成任务
    const taskResult = await this.checkTaskIsFinish(taskInfo, user);
    if (!taskResult.finish) {
      return this.replyFail(BlockErrorCode.taskNotFinish);
    }

    if (taskResult.receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    if (taskInfo.taskType !== BlockSevenTaskType.gift) {
      for (let i = 0; i < taskInfo.prizeList.length; i++) {
        const prizeInfo = taskInfo.prizeList[i];
        await this.receivePrize(prizeInfo, user, BlockDiamondLogType.giveBySevenTask, message.multiple);
      }

      // 创建领取记录
      const data = {
        playerId: user._id.toString(),
        shortId: user.shortId,
        taskId: taskInfo.taskId,
        taskConfig: taskInfo,
        createAt: new Date()
      };

      await BlockSevenTaskRecord.create(data);
    } else {
      // 1. 判断用户钻石是否充足
      // if (user.gem < taskInfo.currentCost) {
      //   return this.replyFail(BlockErrorCode.diamondInsufficient);
      // }
      //
      // // 2. 消耗钻石，生成消耗记录
      // user.gem -= taskInfo.currentCost;
      // user.save();
      //
      // await BlockDiamondRecord.create({
      //   player: user._id.toString(),
      //   amount: taskInfo.currentCost,
      //   residue: user.gem,
      //   type: BlockDiamondLogType.payGift,
      //   note: "购买福利礼包扣除"
      // });

      // 3. 领取奖励
      for (let i = 0; i < taskInfo.prizeList.length; i++) {
        const prizeInfo = taskInfo.prizeList[i];
        await this.receivePrize(prizeInfo, user, BlockDiamondLogType.giveBySevenTask);
      }

      // 4. 创建领取记录
      const data = {
        playerId: user._id.toString(),
        shortId: user.shortId,
        taskId: taskInfo.taskId,
        taskConfig: taskInfo,
        createAt: new Date()
      };

      await BlockSevenTaskRecord.create(data);
    }

    const taskList = await this.getSevenTaskList(message, user);

    return this.replySuccess({record: taskInfo, taskData: taskList});
  }

  // 领取7日狂欢累计活跃奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string',
      taskType: 'number',
      day: 'number'
    }
  })
  async receiveSevenTotalActivity(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 计算完成任务数
    const finishTaskCount = await BlockSevenTaskRecord.count({shortId: user.shortId});

    // 获取奖励配置
    const prizeInfo = await BlockSevenTaskTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    if (finishTaskCount < prizeInfo.liveness) {
      return this.replyFail(BlockErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await BlockSevenTaskTotalPrizeRecord.findOne({shortId: user.shortId, "prizeConfig.liveness": prizeInfo.liveness});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receivePrize(prizeInfo, user, BlockDiamondLogType.giveBySevenTask);

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    const record = await BlockSevenTaskTotalPrizeRecord.create(data);
    const taskList = await this.getSevenTaskList(message, user);

    return this.replySuccess({record, taskData: taskList});
  }

  // 商城礼包列表
  @addApi({
    rule: {
      openid: 'string',
    }
  })
  async getShopData(message) {
    const result = await this.getGiftData(message);

    return this.replySuccess(result);
  }

  // 商城礼包购买
  @addApi({
    rule: {
      openid: 'string',
      giftId: 'string',
    }
  })
  async payShopGift(message) {
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    let rewardList = [];

    // 查询礼包配置
    const giftInfo = await BlockShop.findOne({_id: message.giftId}).lean();
    if (!giftInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }
    if (giftInfo.amount > 0 && user.gem < giftInfo.amount) {
      return this.replyFail(BlockErrorCode.diamondInsufficient);
    }

    // 如果付费礼包，则扣除钻石
    if (giftInfo.amount > 0) {
      // 2. 消耗钻石，生成消耗记录
      user.gem -= giftInfo.amount;
      user.save();

      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: giftInfo.amount,
        residue: user.gem,
        type: BlockDiamondLogType.payShop,
        note: "购买商城礼包扣除"
      });
    }

    // 如果是新手礼包
    if ((giftInfo.type === BlockShopType.gift && giftInfo.giftType === BlockShopGiftType.new)) {
      // 如果是新手礼包，判断今日是否已领取，累计领取次数
      const alreadyReceiveCount = await BlockShopGiftPayRecord.count({giftId: giftInfo._id,
        playerId: user._id.toString()});
      const todayReceiveCount = await BlockShopGiftPayRecord.count({giftId: giftInfo._id, createAt:
            {$gte: start, $lt: end}, playerId: user._id.toString()});

      if (todayReceiveCount >= giftInfo.todayCount) {
        return this.replyFail(BlockErrorCode.todayReceiveLimit);
      }
      if (alreadyReceiveCount >= giftInfo.receiveCount) {
        return this.replyFail(BlockErrorCode.totalReceiveLimit);
      }

      rewardList = giftInfo.prizeLists;

      // 领取奖励
      await Promise.all(giftInfo.prizeLists.map(async (prize: any) => {
        await this.receivePrize(prize, user, BlockDiamondLogType.giveByShop);
      }));
    }

    // 如果是金币礼包，钻石礼包，体力礼包
    if ([BlockShopType.gold, BlockShopType.diamond, BlockShopType.power].includes(giftInfo.type)) {
      // 判断是否是免费礼包，是的话判断剩余次数
      if (giftInfo.amount === 0) {
        const todayReceiveCount = await BlockShopGiftPayRecord.count({giftId: giftInfo._id, createAt:
            {$gte: start, $lt: end}, playerId: user._id.toString()});
        if (todayReceiveCount >= giftInfo.todayCount) {
          return this.replyFail(BlockErrorCode.todayReceiveLimit);
        }
      }

      rewardList = giftInfo.prizeLists;

      // 领取奖励
      await Promise.all(giftInfo.prizeLists.map(async (prize: any) => {
        await this.receivePrize(prize, user, BlockDiamondLogType.giveByShop);
      }));
    }

    // 如果是普通礼包或者碎片礼包
    if ([BlockShopGiftType.normal, BlockShopGiftType.debrises].includes(giftInfo.giftType)) {
      const probability = Math.random();
      let totalProbability = 0;
      let prizeLists = [];

      // 根据不同奖励的概率选择抽中奖品
      for (let i = 0; i < giftInfo.prizeLists.length; i++) {
        totalProbability += giftInfo.prizeLists[i].probability;

        if (probability <= totalProbability) {
          prizeLists = giftInfo.prizeLists[i].prizeLists;
          break;
        }
      }

      prizeLists.map((prize: any) => {
        prize.number = this.getPrizeNumber(prize);
      })

      rewardList = prizeLists;

      await Promise.all(prizeLists.map(async (prize: any) => {
        await this.receivePrize({
          type: prize.type,
          number: prize.number,
          propId: prize.propId
        }, user, BlockDiamondLogType.giveByShop);
      }));
    }

    // 增加经验值，判断是否升级
    if (giftInfo.empirical > 0) {
      user.shopGiftEmpirical += giftInfo.empirical;

      // 获取最高级别
      const highestLevelGift = await BlockShopGiftLevel.find().sort({ level: -1 }).limit(1);
      const maxLevel = highestLevelGift[0].level;

      if (user.shopGiftLevel < maxLevel) {
        const nextLevel = await BlockShopGiftLevel.findOne({level: user.shopGiftLevel + 1});

        if (user.shopGiftEmpirical >= nextLevel.empirical) {
          user.shopGiftEmpirical -= nextLevel.empirical;
          user.shopGiftLevel ++;
        }
      }

      user.save();
    }

    // 记录领取日志
    await BlockShopGiftPayRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      giftId: giftInfo._id,
      giftConfig: giftInfo
    });

    const result = await this.getGiftData(message);

    return this.replySuccess({giftLists: result, rewardList});
  }

  // 商城礼包根据等级获得礼包奖品列表
  @addApi({
    rule: {
      type: 'number',
      level: 'number',
    }
  })
  async getGiftPrizes(message) {
    // 查询礼包配置
    const giftList = await BlockShop.find({type: BlockShopType.gift,
      giftType: message.type, level: message.level}).lean();
    if (!giftList.length) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    const prizeLists = giftList.reduce((acc, gift) => {
      return acc.concat(gift.prizeLists.map(prizes => prizes.prizeLists));
    }, []);

    return this.replySuccess(prizeLists);
  }

  // 获取转盘列表
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async getActiveGift(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }
    const result = await BlockTurntablePrize.find();
    const gifts = [];
    for (const conf of result) {
      gifts.push({
        prizeId: conf._id,
        probability: conf.probability,
        num: conf.num,
        type: conf.type,
        propId: conf.propId
      })
    }

    const startAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveStartAt) || '0';
    const endAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveEndAt) || '0';
    const freeCount = await this.service.utils.getGlobalConfigByName(
      GlobalConfigKeys.blockTurntableActiveFreeCount) || 0;
    const count = await this.todayLotteryCount(user._id.toString(), user.shortId);

    this.replySuccess({
      prizeList: gifts,
      lotteryTimes: user.turntableTimes,
      startAt: new Date(parseInt(startAt, 10)),
      endAt: new Date(parseInt(endAt, 10)),
      freeCount: Number(freeCount),
      count,
    });
  }

  // 转盘抽奖
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async activeLottery(message) {
    let startAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveStartAt);
    let endAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveEndAt);
    if (!startAt || !endAt) {
      return this.replyFail(BlockErrorCode.activityIsClose)
    }

    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    startAt = new Date(parseInt(startAt, 10));
    endAt = new Date(parseInt(endAt, 10));
    const now = new Date().getTime();
    if (startAt.getTime() > now || endAt.getTime() < now) {
      // 时间到了
      return this.replyFail(BlockErrorCode.activityIsClose)
    }

    const result = await this.draw(user)
    if (!result.isOk) {
      return this.replyFail(BlockErrorCode.drawFail)
    }

    this.replySuccess({
      // 中奖记录 id
      recordId: result.record._id,
      // 中奖 id
      prizeId: result.record.prizeId,
      // 是否中奖
      isHit: result.record.isHit,
      propId: result.record.prizeConfig && result.record.prizeConfig.propId,
      num: result.record.prizeConfig && result.record.prizeConfig.num,
      type: result.record.prizeConfig && result.record.prizeConfig.type,
      turntableTimes: result.times
    })
  }

  // 领取奖品
  @addApi({
    rule: {
      // 奖品 id
      recordId: 'string'
    }
  })
  async receiveTurntableLotteryPrize(msg) {
    const resp = await this.receiveTurntablePrize(msg.recordId)
    if (!resp.isOk) {
      return this.replyFail(BlockErrorCode.receiveFail)
    }

    this.replySuccess({});
  }

  // 获取抽奖记录
  @addApi({
    rule: {
      openid: "string",
      // 上页最后一个 _id
      nextId: "string?",
      // 每页数量
      limit: "number?"
    }
  })
  async getTurntableLotteryRecord(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 默认10页
    const limit = message.limit || 10;

    // 总数
    const count = await BlockTurntablePrizeRecord.count({
      shortId: user.shortId,
    });

    let records;
    if (message.nextId) {
      records = await BlockTurntablePrizeRecord.find({
        _id: {
          $lt: message.nextId,
        },
        shortId: user.shortId,
      }).limit(limit).sort({ _id: -1 })
    } else {
      records = await BlockTurntablePrizeRecord.find({
        shortId: user.shortId,
      }).limit(limit).sort({ _id: -1 })
    }
    const resp = [];
    for (const r of records) {
      resp.push({
        _id: r._id,
        // 抽奖时间
        createAt: r.createAt,
        // 是否中奖
        isHit: r.isHit,
        // 中奖配置
        prizeConfig: r.prizeConfig && {
          prizeId: r.prizeConfig._id,
          name: r.prizeConfig.name,
          num: r.prizeConfig.num,
          propId: r.prizeConfig.propId,
          type: r.prizeConfig.type,
        } || null,
      })
    }
    this.replySuccess({ list: resp, count });
  }

  // 每日签到列表
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async dailySignLists(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const prizeList = await BlockDailySignPrize.find();
    const datas = [];
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await BlockDailySignPrizeRecord.count({shortId: user.shortId,
      createAt: {$gte: start, $lt: end}});
    const days = await BlockDailySignPrizeRecord.count({shortId: user.shortId});

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await BlockDailySignPrizeRecord.count({shortId: user.shortId, "prizeConfig.day": prizeList[i].day});
      const data = {
        id: prizeList[i].propId,
        count: prizeList[i].number,
        prizeId: prizeList[i]._id.toString(),
        receive: !!receive
      };

      datas.push(data);
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await BlockDailySignTotalPrize.find();
    const totals = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await BlockDailySignTotalPrizeRecord.count({shortId: user.shortId,
        "prizeConfig.liveness": totalPrizeList[i].liveness});
      const data = {
        id: totalPrizeList[i].propId,
        count: totalPrizeList[i].number,
        liveness: totalPrizeList[i].liveness,
        prizeId: totalPrizeList[i]._id.toString(),
        receive: !!isReceive
      };

      totals.push(data);
    }

    return this.replySuccess({isTodaySign: !!isTodaySign, days, signList: datas, totalList: totals});
  }

  // 领取每日签到奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string',
      multiple: "number?"
    }
  })
  async dailySignIn(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (!message.multiple) {
      message.multiple = 1;
    }

    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await BlockDailySignPrizeRecord.count({shortId: user.shortId,
      createAt: {$gte: start, $lt: end}});
    if (!!isTodaySign) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    const days = await BlockDailySignPrizeRecord.count({shortId: user.shortId});

    // 获取奖励配置
    const prizeInfo = await BlockDailySignPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }
    if (days + 1 !== prizeInfo.day) {
        return this.replyFail(BlockErrorCode.notReceiveTime);
    }

    // 判断是否领取
    const receive = await BlockDailySignPrizeRecord.findOne({shortId: user.shortId, "prizeConfig.day": prizeInfo.day});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    await this.receiveCurrencyPrize(prizeInfo, user, message.multiple);

    if (prizeInfo.type === BlockCurrencyType.diamond) {
      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: prizeInfo.number,
        residue: user.gem + prizeInfo.number * message.multiple,
        type: BlockDiamondLogType.giveByDailySign,
        note: "每日签到获得"
      });
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      multiple: message.multiple,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    await BlockDailySignPrizeRecord.create(data);

    return this.replySuccess(data);
  }

  // 领取每日签到累计活跃奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string'
    }
  })
  async receiveDailySignTotalActivity(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 计算完成任务数
    const finishTaskCount = await BlockDailySignPrizeRecord.count({shortId: user.shortId});

    // 获取奖励配置
    const prizeInfo = await BlockDailySignTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    if (finishTaskCount < prizeInfo.liveness) {
      return this.replyFail(BlockErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await BlockDailySignTotalPrizeRecord.findOne({shortId: user.shortId, "prizeConfig.liveness": prizeInfo.liveness});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receiveCurrencyPrize(prizeInfo, user);

    if (prizeInfo.type === BlockCurrencyType.diamond) {
      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: prizeInfo.number,
        residue: user.gem + prizeInfo.number,
        type: BlockDiamondLogType.giveByDailySign,
        note: "每日签到获得"
      });
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    const record = await BlockDailySignTotalPrizeRecord.create(data);

    return this.replySuccess(record);
  }

  // 获取召唤基础配置
  @addApi({
    rule: {
      openid: 'string',
      summonType: 'number',
      roleType: 'number'
    }
  })
  async getSummonData(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const summonData = await BlockRoleSummon.findOne({summonType: message.summonType,
      roleType: message.roleType}).lean();

    //计算召唤次数
    const summonCount = await BlockRoleSummonRecord.count({playerId: user._id.toString(),
      "summonConfig.roleType": message.roleType, "summonConfig.summonType": message.summonType});
    summonData.summonCount = summonCount;
    summonData.summonHignCount = summonData.summonHignCount - summonCount % summonData.summonHignCount;

    // 获取上一次免费召唤记录
    const freeData = await BlockRoleSummonRecord.findOne({playerId: user._id.toString(),
      isFree: true, "summonConfig.roleType": message.roleType, "summonConfig.summonType": message.summonType}).sort({createAt: -1});

    // 没有使用过免费召唤，免费召唤超过冷却期
    if (freeData && Date.parse(freeData.createAt) + 1000 * 60 * 60 * 24 * summonData.coolingTime
        > new Date().getTime()) {
      summonData.todayFreeCount = 0;
      summonData.coolingTime = Date.parse(freeData.createAt) + 1000 * 60 * 60 * 24 * summonData.coolingTime;
    }

    return this.replySuccess(summonData);
  }

  // 单次召唤
  @addApi({
    rule: {
      openid: 'string',
      summonType: 'number',
      roleType: 'number'
    }
  })
  async SummonOneTimes(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const summonData = await BlockRoleSummon.findOne({summonType: message.summonType,
      roleType: message.roleType});
    let summonLevel = summonData.summonLevel;
    let todayFreeCount = summonData.todayFreeCount;
    let isHignOpportunity = false;

    const lock = await service.utils.grantLockOnce(RedisKey.summonLock + summonData._id.toString(), 1);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }

    //计算召唤次数
    const summonCount = await BlockRoleSummonRecord.count({playerId: user._id.toString(),
      "summonConfig.roleType": message.roleType, "summonConfig.summonType": message.summonType});
    const summonHignCount = summonData.summonHignCount - summonCount % summonData.summonHignCount;
    if (summonHignCount === 2) {
      summonData.isHignOpportunity = true;
    }

    // 获取上一次免费召唤记录
    const freeData = await BlockRoleSummonRecord.findOne({playerId: user._id.toString(),
      isFree: true, "summonConfig.roleType": message.roleType, "summonConfig.summonType": message.summonType}).sort({createAt: -1});

    // 没有使用过免费召唤，免费召唤超过冷却期
    if (freeData && Date.parse(freeData.createAt) + 1000 * 60 * 60 * 24 * summonData.coolingTime
        > new Date().getTime()) {
      todayFreeCount = 0;
    }

    // 如果可以高级召唤，则查询高级召唤角色信息
    if (1 === summonHignCount && summonData.isHignOpportunity) {
      summonLevel = [summonData.summonHignLevel];
      summonData.isHignOpportunity = false;
      isHignOpportunity = true;
    }

    // 获取符合等级的士兵/英雄
    const roleBases = await BlockRoleBase.find({quality: {$in: summonLevel}, type: message.roleType}).lean();
    if (!roleBases.length) {
      return this.replyFail(BlockErrorCode.debrisNotFound);
    }

    // 扣除金币/钻石
    if (!todayFreeCount) {
      if (summonData.currencyType === ConsumeAmountType.gold && user.gold < summonData.consumeAmountOne) {
        return this.replyFail(BlockErrorCode.goldInsufficient);
      }
      if (summonData.currencyType === ConsumeAmountType.diamond && user.gem < summonData.consumeAmountOne) {
        return this.replyFail(BlockErrorCode.diamondInsufficient);
      }

      await this.consumeAmount(summonData.currencyType, summonData.consumeAmountOne, user._id);

      if (summonData.currencyType === ConsumeAmountType.diamond) {
        await BlockDiamondRecord.create({
          player: user._id.toString(),
          amount: summonData.consumeAmountOne,
          residue: user.gem - summonData.consumeAmountOne,
          type: BlockDiamondLogType.paySummon,
          note: "召唤扣除"
        });
      }
    }

    // 获取指定碎片
    const hitDebris = await this.service.lottery.randomWithNoPrize(await this.getSummonRoleProbability(roleBases));

    // 生成召唤碎片数量
    hitDebris.debrisCount = Math.floor(Math.random() * (hitDebris.summonDebris[1] -
        hitDebris.summonDebris[0] + 1) + hitDebris.summonDebris[0]);

    if (isHignOpportunity) {
      hitDebris.debrisCount = hitDebris.upgradeDebris;
    }

    // 增加碎片
    const propInfo = await this.getBackPackInfo({propId: hitDebris.roleId}, user);
    hitDebris.new = propInfo.number === 0;
    propInfo.number += hitDebris.debrisCount;
    propInfo.save();


    // 记录召唤日志
    await BlockRoleSummonRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      isFree: todayFreeCount > 0,
      isHignOpportunity,
      debrisCount: hitDebris.debrisCount,
      summonId: summonData._id,
      summonConfig: summonData
    });

    await summonData.save();

    return this.replySuccess(hitDebris);
  }

  // 10次召唤
  @addApi({
    rule: {
      openid: 'string',
      summonType: 'number',
      roleType: 'number'
    }
  })
  async SummonTenTimes(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const lock = await service.utils.grantLockOnce(RedisKey.summonLock + user._id.toString(), 2);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }
    const records = [];

    for (let i = 0; i < 10; i++) {
      const summonData = await BlockRoleSummon.findOne({summonType: message.summonType,
        roleType: message.roleType});
      let summonLevel = summonData.summonLevel;
      let isHignOpportunity = false;

      // 一开始判断金币/钻石是否充足
      if (i === 0) {
        if (summonData.currencyType === ConsumeAmountType.gold && user.gold < summonData.consumeAmountTen) {
          return this.replyFail(BlockErrorCode.goldInsufficient);
        }

        if (summonData.currencyType === ConsumeAmountType.diamond && user.gem < summonData.consumeAmountTen) {
          return this.replyFail(BlockErrorCode.diamondInsufficient);
        }

        await this.consumeAmount(summonData.currencyType, summonData.consumeAmountTen, user._id);

        if (summonData.currencyType === ConsumeAmountType.diamond) {
          await BlockDiamondRecord.create({
            player: user._id.toString(),
            amount: summonData.consumeAmountTen,
            residue: user.gem - summonData.consumeAmountTen,
            type: BlockDiamondLogType.paySummon,
            note: "召唤扣除"
          });
        }
      }

      //计算召唤次数
      const summonCount = await BlockRoleSummonRecord.count({playerId: user._id.toString(),
        "summonConfig.roleType": message.roleType, "summonConfig.summonType": message.summonType});
      let summonHignCount = summonData.summonHignCount - summonCount % summonData.summonHignCount;
      if (summonHignCount === 2) {
        summonData.isHignOpportunity = true;
      }

      // 如果可以高级召唤，则查询高级召唤角色信息
      if (1 === summonHignCount && summonData.isHignOpportunity) {
        summonLevel = [summonData.summonHignLevel];
        summonData.isHignOpportunity = false;
        isHignOpportunity = true;
      }

      // 获取符合等级的士兵/英雄
      const roleBases = await BlockRoleBase.find({quality: {$in: summonLevel}, type: message.roleType}).lean();
      if (!roleBases.length) {
        return this.replyFail(BlockErrorCode.notReceiveTime);
      }

      // 获取指定碎片
      const hitDebris = await this.service.lottery.randomWithNoPrize(await this.getSummonRoleProbability(roleBases));

      // 生成召唤碎片数量
      hitDebris.debrisCount = Math.floor(Math.random() * (hitDebris.summonDebris[1] -
          hitDebris.summonDebris[0] + 1) + hitDebris.summonDebris[0]);

      if (isHignOpportunity) {
        hitDebris.debrisCount = hitDebris.upgradeDebris;
      }

      // 增加碎片
      const propInfo = await this.getBackPackInfo({ propId: hitDebris.roleId }, user);
      hitDebris.new = propInfo.number === 0;
      propInfo.number += hitDebris.debrisCount;
      await propInfo.save();

      // 记录召唤日志
      await BlockRoleSummonRecord.create({
        playerId: user._id.toString(),
        shortId: user.shortId,
        isFree: false,
        isHignOpportunity,
        debrisCount: hitDebris.debrisCount,
        summonId: summonData._id,
        summonConfig: summonData
      });

      await summonData.save();

      records.push(hitDebris);
    }

    return this.replySuccess(records);
  }

  // 获取任务列表
  @addApi({
    rule: {
      openid: 'string',
      taskType: 'number'
    }
  })
  async taskLists(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const taskData = await this.getDailyTaskData(message, user);

    return this.replySuccess(taskData);
  }

  // 领取任务奖励
  @addApi({
    rule: {
      openid: 'string',
      taskId: 'number?',
      taskType: 'number',
      multiple: 'number?'
    }
  })
  async finishTask(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (!message.multiple) {
      message.multiple = 1;
    }

    if (message.taskId) {
      const result = await this.finishDailyTaskOnce(message, user);
      return this.replySuccess(result);
    }

    const result = await this.finishDailyTaskAll(message, user);
    return this.replySuccess(result);
  }

  // 领取任务累计活跃奖励
  @addApi({
    rule: {
      openid: 'string',
      prizeId: 'string',
      taskType: 'number'
    }
  })
  async receiveTaskTotalActivity(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 计算活跃度
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const liveness = await BlockTaskRecord.aggregate([
      { $match: { playerId: user._id.toString(), createAt: {$gte: start, $lt: end} } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取奖励配置
    const prizeInfo = await BlockTaskTotalPrize.findOne({_id: message.prizeId});
    if (!prizeInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    if (livenessCount < prizeInfo.liveness) {
      return this.replyFail(BlockErrorCode.taskNotFinish);
    }

    // 判断是否领取
    const receive = await BlockTaskTotalPrizeRecord.findOne({shortId: user.shortId, prizeId: prizeInfo._id, createAt: {$gte: start, $lt: end}});

    if (receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    await this.receiveCurrencyPrize(prizeInfo, user);

    if (prizeInfo.type === BlockCurrencyType.diamond) {
      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: prizeInfo.number,
        residue: user.gem + prizeInfo.number,
        type: BlockDiamondLogType.giveByTask,
        note: "任务宝箱获得"
      });
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      prizeId: prizeInfo._id,
      prizeConfig: prizeInfo,
      createAt: new Date()
    };

    const record = await BlockTaskTotalPrizeRecord.create(data);
    const taskData = await this.getDailyTaskData(message, user);

    return this.replySuccess({record, taskData});
  }

  // 记录闯关日志
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async addSectionLog(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      curLevel: user.curLevel,
      createAt: new Date()
    };

    const record = await BlockPassSectionRecord.create(data);

    return this.replySuccess(record);
  }

  // 记录观看视频日志
  @addApi({
    rule: {
      openid: 'string',
      adId: "string?"
    }
  })
  async addWatchAdverLog(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      adId: null
    };

    if (message.adId) {
      data.adId = message.adId;
    }

    const record = await BlockWatchAdverRecord.create(data);

    return this.replySuccess(record);
  }

  // 记录通关日志
  @addApi({
    rule: {
      openid: 'string',
      curLevel: 'number',
      blockCount: 'number',
      enemyCount: 'number',
      success: 'number?'
    }
  })
  async saveSectionDetailLog(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (user.curLevel < message.curLevel) {
      user.curLevel = message.curLevel;
      user.save();
    }

    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      curLevel: message.curLevel,
      blockCount: message.blockCount,
      enemyCount: message.enemyCount,
      success: !!message.success
    };

    const record = await BlockSectionDetailRecord.create(data);

    return this.replySuccess(record);
  }

  // 结束页领取奖励
  @addApi({
    rule: {
      openid: 'string',
      waveIds: 'array',
      double: 'boolean'
    }
  })
  async receiveGamePrizes(message) {
    const user = await BlockUser.findOne({openid: message.openid}).lean();
    const batchId = new mongoose.Types.ObjectId();
    const records = [];
    let getAmount = 0;

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    for (let j = 0; j < message.waveIds.length; j++) {
      const waveId = message.waveIds[j];
      const waveNumbers = await BlockWaveNumber.findOne({waveId: waveId}).lean();

      // 领取奖励
      await Promise.all(waveNumbers.prizeLists.map(async (prize: any) => {
        if (message.double) {
          prize.number *= 2;
        }

        if (prize.type === BlockCurrencyType.diamond) {
          getAmount += prize.number;
        }

        await this.receiveCurrencyPrize(prize, user);
      }));

      const data = {
        playerId: user._id.toString(),
        shortId: user.shortId,
        batchId,
        double: message.double,
        waveId: waveNumbers.waveId,
        waveConfig: waveNumbers
      };

      records.push({waveId: waveNumbers.waveId, batchId, double: message.double, prizeLists: waveNumbers.prizeLists});

      await BlockWaveNumberRecord.create(data);
    }

    if (getAmount > 0) {
      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: getAmount,
        residue: user.gem + getAmount,
        type: BlockDiamondLogType.giveByGame,
        note: "对局奖励获得"
      });
    }

    const userInfo = await this.getFullUserInfo(user);
    return this.replySuccess({userInfo, records});
  }

  // 对局复活
  @addApi({
    rule: {
      openid: 'string',
      consumeAmount: 'number'
    }
  })
  async resurrection(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (message.consumeAmount > 0) {
      if (user.gem < message.consumeAmount) {
        return this.replyFail(BlockErrorCode.diamondInsufficient);
      }

      user.gem -= message.consumeAmount;

      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: message.consumeAmount,
        residue: user.gem,
        type: BlockDiamondLogType.payGame,
        note: "复活扣除"
      });
    }

    // 复活赠送5体力
    user.power += 5;
    await user.save();

    const userInfo = await this.getFullUserInfo(user);
    return this.replySuccess(userInfo);
  }

  // 获取重置数据
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async getResetData(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const resetCount = await BlockRoleResetRecord.count({
      playerId: user._id.toString(),
      isFree: false,
      createAt: {$gte: start, $lt: end}
    })

    const resetFreeCount = await BlockRoleResetRecord.count({
      playerId: user._id.toString(),
      isFree: true,
      createAt: {$gte: start, $lt: end}
    })

    return this.replySuccess({resetCount, resetFreeCount, todayFreeCount: 3});
  }

  // 重置角色/英雄等级
  @addApi({
    rule: {
      openid: 'string',
      roleId: 'number',
      consumeAmount: 'number'
    }
  })
  async resetRoleLevel(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const role = await BlockRole.findOne({roleId: message.roleId, playerId: user._id.toString()});

    if (!role) {
      return this.replyFail(BlockErrorCode.roleNotFound);
    }

    const roleBase = await BlockRoleBase.findOne({baseId: message.roleId});

    if (!roleBase) {
      return this.replyFail(BlockErrorCode.roleNotFound);
    }

    // 计算累计消耗金币
    const consumeGold = this.calcConsumeGold(role, roleBase);

    // 计算重置金币
    const resetConsumeGold = consumeGold * (role.level > 50 ? roleBase.returnRadio : 1);

    if (message.consumeAmount > 0) {
      if (user.gem < message.consumeAmount) {
        return this.replyFail(BlockErrorCode.diamondInsufficient);
      }

      user.gem -= message.consumeAmount;
      user.save();

      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: message.consumeAmount,
        residue: user.gem,
        type: BlockDiamondLogType.payReset,
        note: "角色重置扣除"
      });
    }

    await BlockRoleResetRecord.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      roleId: message.roleId,
      roleConfig: roleBase,
      roleInfo: role,
      consumeGold,
      isFree: message.consumeAmount === 0,
      roleLevel: role.level,
      resetGold: resetConsumeGold,
      consumeDiamond: message.consumeAmount
    });

    // 重置金币
    user.gold += resetConsumeGold;
    await user.save();

    // 重置角色等级
    role.level = 1;
    await role.save();

    const userInfo = await this.getFullUserInfo(user);
    return this.replySuccess(userInfo);
  }

  // 技能刷新
  @addApi({
    rule: {
      openid: 'string',
      consumeAmount: 'number'
    }
  })
  async skillRefresh(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    if (message.consumeAmount > 0) {
      if (user.gem < message.consumeAmount) {
        return this.replyFail(BlockErrorCode.diamondInsufficient);
      }

      user.gem -= message.consumeAmount;
      user.save();

      await BlockDiamondRecord.create({
        player: user._id.toString(),
        amount: message.consumeAmount,
        residue: user.gem,
        type: BlockDiamondLogType.skillRefresh,
        note: "技能刷新扣除"
      });
    }

    const userInfo = await this.getFullUserInfo(user);
    return this.replySuccess(userInfo);
  }

  // 关卡排行榜
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async curLevelRanking(message) {
    const user = await BlockUser.findOne({openid: message.openid}).lean();
    const users = [];

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    const userList = await BlockUser.find().sort({curLevel: -1}).limit(100);

    for (let i = 0; i < userList.length; i++) {
      users.push({
        index: i + 1,
        nickname: userList[i].nickname,
        avatar: userList[i].avatar,
        province: userList[i].province,
        city: userList[i].city,
        shortId: userList[i].shortId,
        curLevel: userList[i].curLevel
      })
    }

    let index = userList.findIndex(u => u.openid === user.openid);
    if (index !== -1) {
      index++;
    }

    return this.replySuccess({user: {
        index,
        nickname: user.nickname,
        avatar: user.avatar,
        province: user.province,
        city: user.city,
        shortId: user.shortId,
        curLevel: user.curLevel
      }, userList: users});
  }

  // 关卡通关奖励红包
  @addApi({
    rule: {
      openid: 'string',
      mapId: 'number'
    }
  })
  async passSectionAddRedPocket(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 查询关卡配置
    const mapConfig = await BlockCurLevel.findOne({mapId: message.mapId});
    if (!mapConfig) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    // 判断是否已经领取过本关卡红包
    const receiveCount = await BlockSectionRedPocketRecord.count({playerId: user._id.toString(), mapId: message.mapId});
    if (receiveCount) {
      return this.replyFail(BlockErrorCode.receiveFail);
    }

    // 生成召唤碎片数量
    const redPocket = Math.floor(Math.random() * (mapConfig.cashs[1] -
      mapConfig.cashs[0] + 1) + mapConfig.cashs[0]);
    user.redPocket += redPocket;
    user.save();

    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      curLevel: mapConfig.number,
      mapId: mapConfig.mapId,
      redPocket
    };

    const record = await BlockSectionRedPocketRecord.create(data);

    // 生成获得红包记录
    const data1 = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      redPocket,
      curLevel: mapConfig.number,
      action: 1,
      type: 1
    }

    await BlockRedPocketRecord.create(data1);

    return this.replySuccess(record);
  }

  // 提现数据接口
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async getWithdrawData(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 查询关卡配置
    const withdrawConfig = await BlockWithdrawConfig.find().lean();
    if (!withdrawConfig) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    for (let i = 0; i < withdrawConfig.length; i++) {
      const canWithdraw = await BlockRedPocketWithdrawRecord.count({playerId: user._id.toString(), configId: withdrawConfig[i]._id});
      withdrawConfig[i].canWithdraw = canWithdraw < withdrawConfig[i].limitCount;
      withdrawConfig[i].withdrawCount = canWithdraw;
      withdrawConfig[i].dailySignDay = await BlockDailySignPrizeRecord.count({playerId: user._id.toString()});
      withdrawConfig[i].totalWatchDay = await BlockWatchAdverRecord.count({playerId: user._id.toString()});
    }

    return this.replySuccess({redPocket: user.redPocket, lists: withdrawConfig});
  }

  // 提现接口
  @addApi({
    rule: {
      openid: 'string',
      configId: "string"
    }
  })
  async redPocketWithdraw(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 查询关卡配置
    const withdrawConfig = await BlockWithdrawConfig.findOne({_id: message.configId});
    if (!withdrawConfig) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }
    if (user.redPocket < withdrawConfig.number) {
      return this.replyFail(BlockErrorCode.redPocketInsufficient);
    }

    // 查询提现次数
    const withdrawCount = await BlockRedPocketWithdrawRecord.count({playerId: user._id.toString(), configId: withdrawConfig._id});
    if (withdrawConfig.limit <= withdrawCount) {
      return this.replyFail(BlockErrorCode.withdrawCountLimit);
    }

    // 查询签到天数
    const dailySignDay = await BlockDailySignPrizeRecord.count({playerId: user._id.toString()});
    if (withdrawConfig.signDay > dailySignDay) {
      return this.replyFail(BlockErrorCode.withdrawSignLimit);
    }

    const totalWatchDay = await BlockWatchAdverRecord.count({playerId: user._id.toString()});
    if (withdrawConfig.watchCount > totalWatchDay) {
      return this.replyFail(BlockErrorCode.withdrawWatchLimit);
    }

    // 扣除红包
    user.redPocket -= withdrawConfig.number;
    user.save();


    // 生成提现记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      redPocket: withdrawConfig.number,
      config: withdrawConfig,
      configId: withdrawConfig._id.toString(),
      status: false
    }

    const record = await BlockRedPocketWithdrawRecord.create(data);

    // 生成扣除红包记录
    const data1 = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      redPocket: withdrawConfig.number,
      action: 2,
      type: 2
    }

    await BlockRedPocketRecord.create(data1);

    return this.replySuccess(record);
  }

  async getDailyTaskData(message, user) {
    const taskLists = await this.getDailyTaskDataByType(message, user);
    const sortTasks = this.sortTasks(taskLists);
    const canReceive = this.checkDailyTaskReceive(taskLists);

    // 计算活跃度
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const liveness = await BlockTaskRecord.aggregate([
      { $match: { playerId: user._id.toString(), createAt: {$gte: start, $lt: end} } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await BlockTaskTotalPrize.find();
    const totalLists = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await BlockTaskTotalPrizeRecord.count({playerId: user._id.toString(),
        prizeId: totalPrizeList[i]._id, createAt: {$gte: start, $lt: end}});
      const data = {
        id: totalPrizeList[i].propId,
        count: totalPrizeList[i].number,
        liveness: totalPrizeList[i].liveness,
        prizeId: totalPrizeList[i]._id.toString(),
        receive: !!isReceive
      };

      totalLists.push(data);
    }

    return {canReceive, taskLists: sortTasks, totalLists, liveness: livenessCount};
  }

  // 换一换增加体力
  @addApi({
    rule: {
      openid: 'string'
    }
  })
  async transferPower(message) {
    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    // 换一换赠送5体力
    user.power += 5;
    await user.save();

    const userInfo = await this.getFullUserInfo(user);
    return this.replySuccess(userInfo);
  }

  async getDailyTaskDataByType(message, user) {
    let taskLists = [];
    const tasks = [];
    let isAllFinish = true;
    let finishCount = 0;

    if(message.taskType === BlockTaskTypes.achievement) {
      // 添加累登任务
      const accumulateLogin = await this.getAchievementTask(user, [BlockTaskType.achievementLoginThree, BlockTaskType.achievementLoginThrity]);
      if (accumulateLogin && accumulateLogin.taskId) taskLists.push(accumulateLogin);

      // 添加解锁士兵任务
      const unlockSoldier = await this.getAchievementTask(user, [BlockTaskType.achievementSoldierOne, BlockTaskType.achievementSoldierTen]);
      if (unlockSoldier && unlockSoldier.taskId) taskLists.push(unlockSoldier);

      // 添加解锁英雄任务
      const unlockHero = await this.getAchievementTask(user, [BlockTaskType.achievementHeroOne, BlockTaskType.achievementHeroTen]);
      if (unlockHero && unlockHero.taskId) taskLists.push(unlockHero);

      // 添加通关关卡任务
      const passSection = await this.getAchievementTask(user, [BlockTaskType.achievementPassSectionOne, BlockTaskType.achievementPassSectionThirty]);
      if (passSection && passSection.taskId) taskLists.push(passSection);

      // 添加召唤任务
      const summon = await this.getAchievementTask(user, [BlockTaskType.achievementSummonOne, BlockTaskType.achievementSummonTen]);
      if (summon && summon.taskId) taskLists.push(summon);

      // 添加士兵升级任务
      const soldierUpgradeLevel = await this.getAchievementTask(user, [BlockTaskType.achievementSoldierUpgradeLevelOne, BlockTaskType.achievementSoldierUpgradeLevelFive]);
      if (soldierUpgradeLevel && soldierUpgradeLevel.taskId) taskLists.push(soldierUpgradeLevel);

      // 添加士兵升阶任务
      const soldierUpgradeQuality = await this.getAchievementTask(user, [BlockTaskType.achievementSoldierUpgradeQualityOne, BlockTaskType.achievementSoldierUpgradeQualityFive]);
      if (soldierUpgradeQuality && soldierUpgradeQuality.taskId) taskLists.push(soldierUpgradeQuality);

      // 添加英雄升级任务
      const heroUpgradeLevel = await this.getAchievementTask(user, [BlockTaskType.achievementHeroUpgradeLevelOne, BlockTaskType.achievementHeroUpgradeLevelFive]);
      if (heroUpgradeLevel && heroUpgradeLevel.taskId) taskLists.push(heroUpgradeLevel);

      // 添加英雄升阶任务
      const heroUpgradeQuality = await this.getAchievementTask(user, [BlockTaskType.achievementHeroUpgradeQualityOne, BlockTaskType.achievementHeroUpgradeQualityFive]);
      if (heroUpgradeQuality && heroUpgradeQuality.taskId) taskLists.push(heroUpgradeQuality);

      // 添加消灭敌人任务
      const eliminateEnemy = await this.getAchievementTask(user, [BlockTaskType.achievementEliminateEnemyOne, BlockTaskType.achievementEliminateEnemyEight]);
      if (eliminateEnemy && eliminateEnemy.taskId) taskLists.push(eliminateEnemy);

      // 添加观看广告任务
      const watchAdver = await this.getAchievementTask(user, [BlockTaskType.achievementWatchAdverOne, BlockTaskType.achievementWatchAdverNine]);
      if (watchAdver && watchAdver.taskId) taskLists.push(watchAdver);
    } else {
      taskLists = await BlockTask.find({taskType: message.taskType}).lean();
    }

    // 判断是否完成任务和领取奖励
    for (let i = 0; i < taskLists.length; i++) {
      tasks.push(await this.checkTaskFinishAndReceive(taskLists[i], user));
    }

    if (message.taskType === BlockTaskTypes.daily) {
      // 判断是否完成所有任务
      for (let i = 0; i < tasks.length - 1; i++) {
        if (!tasks[i].finish) {
          isAllFinish = false;
        } else {
          finishCount++;
        }
      }

      tasks[tasks.length - 1].finish = isAllFinish;
      tasks[tasks.length - 1].finishCount = finishCount;
    }

    return taskLists;
  }

  async getAchievementTask(user, taskIds) {
    let task = null;
    const tasks = await BlockTask.find({taskId: {$gte: taskIds[0], $lte: taskIds[1]}}).lean();

    for (let i = 0; i < tasks.length; i++) {
      const taskInfo = await this.checkTaskFinishAndReceive(tasks[i], user);
      if (!taskInfo.finish || (taskInfo.finish && !taskInfo.receive)) {
        task = taskInfo;
        break;
      }
    }

    return task;
  }

  async checkTaskFinishAndReceive(task, user) {
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    // 每日登录任务
    if (task.taskId === BlockTaskType.dailyLogin) {
      task.finish = true;
      task.finishCount = 1;
    }

    // 每日购买体力/礼包任务
    if ([BlockTaskType.dailyPayPower, BlockTaskType.dailyPayGift].includes(task.taskId)) {
      const todayPayCount = await BlockShopGiftPayRecord.count({
        "giftConfig.type": task.taskId === BlockTaskType.dailyPayPower ? BlockShopType.power : BlockShopType.gift,
        "playerId": user._id.toString(),
        "createAt": { $gte: start, $lt: end }
      });

      task.finish = todayPayCount >= task.taskTimes;
      task.finishCount = todayPayCount >= task.taskTimes ? task.taskTimes : todayPayCount;
    }

    // 消除方块任务
    if (task.taskId === BlockTaskType.dailyEliminateBlock) {
      const summary = await BlockSectionDetailRecord.aggregate([
        { $match: { playerId: user._id.toString(), createAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, sum: { $sum: "$blockCount" } } }
      ]).exec();
      let blockCount = 0;
      if (summary.length > 0) {
        blockCount = summary[0].sum;
      }

      task.finish = blockCount >= task.taskTimes;
      task.finishCount = blockCount >= task.taskTimes ? task.taskTimes : blockCount;
    }

    // 消除敌人任务
    if (task.taskId === BlockTaskType.dailyEliminateEnemy) {
      const summary = await BlockSectionDetailRecord.aggregate([
        { $match: { playerId: user._id.toString(), createAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, sum: { $sum: "$enemyCount" } } }
      ]).exec();
      let enemyCount = 0;
      if (summary.length > 0) {
        enemyCount = summary[0].sum;
      }

      task.finish = enemyCount >= task.taskTimes;
      task.finishCount = enemyCount >= task.taskTimes ? task.taskTimes : enemyCount;
    }

    // 碎片召唤任务
    if (task.taskId === BlockTaskType.dailySummon) {
      const summonCount = await BlockRoleSummonRecord.count({
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      })

      task.finish = summonCount >= task.taskTimes;
      task.finishCount = summonCount >= task.taskTimes ? task.taskTimes : summonCount;
    }

    // 士兵/英雄升级任务
    if ([BlockTaskType.dailySoldierUpgradeLevel, BlockTaskType.dailyHeroUpgradeLevel].includes(task.taskId)) {
      const upgradeCount = await BlockRoleUpgradeRecord.count({
        playerId: user._id.toString(),
        roleType: task.taskId === BlockTaskType.dailySoldierUpgradeLevel ? 1 : 2,
        type: 1,
        createAt: { $gte: start, $lt: end }
      })

      task.finish = upgradeCount >= task.taskTimes;
      task.finishCount = upgradeCount >= task.taskTimes ? task.taskTimes : upgradeCount;
    }

    // 参与关卡任务
    if (task.taskId === BlockTaskType.dailyPassSection) {
      const joinCount = await BlockPassSectionRecord.count({
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      })

      task.finish = joinCount >= task.taskTimes;
      task.finishCount = joinCount >= task.taskTimes ? task.taskTimes : joinCount;
    }

    // 观看广告任务
    if (task.taskId === BlockTaskType.dailyWatchAdver) {
      const joinCount = await BlockWatchAdverRecord.count({
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      })

      task.finish = joinCount >= task.taskTimes;
      task.finishCount = joinCount >= task.taskTimes ? task.taskTimes : joinCount;
    }

    // 成就：连续登录任务
    if (task.taskId >= BlockTaskType.achievementLoginThree && task.taskId <= BlockTaskType.achievementLoginThrity) {
      task.finishCount = user.consecutiveLoginDays;
      task.finish = user.consecutiveLoginDays >= task.taskTimes;
    }

    // 成就：解锁士兵任务
    if (task.taskId >= BlockTaskType.achievementSoldierOne && task.taskId <= BlockTaskType.achievementSoldierTen) {
      task.finishCount = await BlockRole.count({
        playerId: user._id.toString(),
        type: 1
      });
      task.finish = task.finishCount >= task.taskTimes;
    }

    // 成就：解锁英雄任务
    if (task.taskId >= BlockTaskType.achievementHeroOne && task.taskId <= BlockTaskType.achievementHeroTen) {
      task.finishCount = await BlockRole.count({
        playerId: user._id.toString(),
        type: 2
      });
      task.finish = task.finishCount >= task.taskTimes;
    }

    // 成就：通过关卡任务
    if (task.taskId >= BlockTaskType.achievementPassSectionOne && task.taskId <= BlockTaskType.achievementPassSectionThirty) {
      task.finishCount = user.curLevel - 1;
      task.finish = user.curLevel > task.taskTimes;
    }

    // 成就：累计召唤任务
    if (task.taskId >= BlockTaskType.achievementSummonOne && task.taskId <= BlockTaskType.achievementSummonTen) {
      const summonCount = await BlockRoleSummonRecord.count({
        playerId: user._id.toString()
      })
      task.finishCount = summonCount;
      task.finish = summonCount >= task.taskTimes;
    }

    // 成就：士兵升级任务
    if (task.taskId >= BlockTaskType.achievementSoldierUpgradeLevelOne && task.taskId <= BlockTaskType.achievementSoldierUpgradeLevelFive) {
      const upgradeCount = await BlockRoleUpgradeRecord.count({
        playerId: user._id.toString(),
        roleType: 1,
        type: 1
      })
      task.finishCount = upgradeCount;
      task.finish = upgradeCount >= task.taskTimes;
    }

    // 成就：士兵升阶任务
    if (task.taskId >= BlockTaskType.achievementSoldierUpgradeQualityOne && task.taskId <= BlockTaskType.achievementSoldierUpgradeQualityFive) {
      const upgradeCount = await BlockRoleUpgradeRecord.count({
        playerId: user._id.toString(),
        roleType: 1,
        type: 2
      })
      task.finishCount = upgradeCount;
      task.finish = upgradeCount >= task.taskTimes;
    }

    // 成就：英雄升级任务
    if (task.taskId >= BlockTaskType.achievementHeroUpgradeLevelOne && task.taskId <= BlockTaskType.achievementHeroUpgradeLevelFive) {
      const upgradeCount = await BlockRoleUpgradeRecord.count({
        playerId: user._id.toString(),
        roleType: 2,
        type: 1
      })
      task.finishCount = upgradeCount;
      task.finish = upgradeCount >= task.taskTimes;
    }

    // 成就：士兵升阶任务
    if (task.taskId >= BlockTaskType.achievementHeroUpgradeQualityOne && task.taskId <= BlockTaskType.achievementHeroUpgradeQualityFive) {
      const upgradeCount = await BlockRoleUpgradeRecord.count({
        playerId: user._id.toString(),
        roleType: 2,
        type: 2
      })
      task.finishCount = upgradeCount;
      task.finish = upgradeCount >= task.taskTimes;
    }

    // 成就：消灭敌人任务
    if (task.taskId >= BlockTaskType.achievementEliminateEnemyOne && task.taskId <= BlockTaskType.achievementEliminateEnemyEight) {
      const summary = await BlockSectionDetailRecord.aggregate([
        { $match: { player: user._id.toString() } },
        { $group: { _id: null, sum: { $sum: "$enemyCount" } } }
      ]).exec();
      let enemyCount = 0;
      if (summary.length > 0) {
        enemyCount = summary[0].sum;
      }
      task.finishCount = enemyCount;
      task.finish = enemyCount >= task.taskTimes;
    }

    // 成就：观看广告任务
    if (task.taskId >= BlockTaskType.achievementWatchAdverOne && task.taskId <= BlockTaskType.achievementWatchAdverNine) {
      const watchCount = await BlockWatchAdverRecord.count({
        playerId: user._id.toString()
      })
      task.finishCount = watchCount;
      task.finish = watchCount >= task.taskTimes;
    }

    const where = {playerId: user._id.toString(), taskId: task.taskId};
    if (task.taskType === BlockTaskTypes.daily) {
      where['createAt'] = {$gte: start, $lt: end};
    }

    const isReceive = await BlockTaskRecord.count(where);
    task.receive = !!isReceive;

    return task;
  }

  async consumeAmount(currencyType, consumeAmount, userId) {
    switch (currencyType) {
      case ConsumeAmountType.gold:
        await BlockUser.update({_id: userId }, {$inc: { gold: -consumeAmount }});
        break;

      case ConsumeAmountType.diamond:
        await BlockUser.update({_id: userId }, {$inc: { gem: -consumeAmount }});
        break;
    }
  }

  // 领奖
  async receiveTurntablePrize(recordId) {
    const lock = await service.utils.grantLockOnce(RedisKey.receiveLottery + recordId, 3);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }

    const record = await BlockTurntablePrizeRecord.findById(recordId);
    if (!record || !record.isHit) {
      // 没有领奖记录 or 未中奖
      await lock.unlock();
      return { isOk: false };
    }

    const model = await BlockUser.findOne({shortId: record.shortId});

    switch (record.prizeConfig.type) {
      case BlockTurntablePrizeType.diamond:
        await BlockUser.update({_id: model._id }, {$inc: { gem: record.prizeConfig.num }});

        await BlockDiamondRecord.create({
          player: model._id.toString(),
          amount: record.prizeConfig.num,
          residue: model.gem + record.prizeConfig.num,
          type: BlockDiamondLogType.giveByTurntable,
          note: "转盘抽奖获得"
        });
        break;

      case BlockOnlinePrizeType.gold:
        await BlockUser.update({_id: model._id }, {$inc: { gold: record.prizeConfig.num }});
        break;

      case BlockOnlinePrizeType.power:
        await BlockUser.update({_id: model._id }, {$inc: { power: record.prizeConfig.num }});
        break;

      case BlockOnlinePrizeType.prop:
        const propInfo = await this.getBackPackInfo({
          propId: record.prizeConfig.propId
        }, model);
        propInfo.number += record.prizeConfig.num;

        propInfo.save();
        break;
    }

    await record.save();
    await lock.unlock();

    return { isOk: true, model };
  }

  async getSevenTaskList(message, user) {
    // 获取活动截止日期
    const expireTime = Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 7;

    // 获取第几天
    const currentTimestamp = Date.now();

    // 计算注册天数
    const diffInSeconds = currentTimestamp - Date.parse(user.createAt);
    const registDays = Math.ceil(diffInSeconds / (1000 * 60 * 60 * 24));

    // 计算完成任务数
    const finishTaskCount = await BlockSevenTaskRecord.count({shortId: user.shortId});

    // 获取累计活跃奖励列表
    const totalPrizeList = await BlockSevenTaskTotalPrize.find();
    const datas = [];

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await BlockSevenTaskTotalPrizeRecord.count({shortId: user.shortId,
        "prizeConfig.liveness": totalPrizeList[i].liveness});
      const data = {
        id: totalPrizeList[i].propId,
        count: totalPrizeList[i].number,
        liveness: totalPrizeList[i].liveness,
        prizeId: totalPrizeList[i]._id.toString(),
        receive: !!isReceive
      };

      datas.push(data);
    }

    // 获取每天的任务列表
    const dailyTaskLists = await BlockSevenTask.find({taskType: {$in:
          this.getSevenTaskType(message.taskType)}, day: message.day}).lean();

    // 福利领取
    if (message.taskType === BlockSevenTaskType.consume) {
      for (let k = 0; k < dailyTaskLists.length; k++) {
        // 消耗任务
        if (dailyTaskLists[k].taskType === BlockSevenTaskType.consume) {
          const summary = await BlockDiamondRecord.aggregate([
            { $match: { player: user._id.toString(), type: {$in: [1, 2, 5]} } },
            { $group: { _id: null, sum: { $sum: "$amount" } } }
          ]).exec();
          let consumeAmount = 0;
          if (summary.length > 0) {
            consumeAmount = summary[0].sum;
          }

          dailyTaskLists[k].finishCount = consumeAmount;
          dailyTaskLists[k].finish = consumeAmount >= dailyTaskLists[k].taskTimes;

          // 判断任务是否领取
          const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});
          dailyTaskLists[k].receive = !!isReceive;
        }

        // 连续登录任务
        if (dailyTaskLists[k].taskType === BlockSevenTaskType.login) {
          // 判断任务是否领取
          const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});

          // 判断登录任务完成次数
          const loginCount = await BlockSevenTaskRecord.count({shortId: user.shortId,
            "taskConfig.taskType": BlockSevenTaskType.login});
          dailyTaskLists[k].finishCount = loginCount + 1;
          dailyTaskLists[k].finish = loginCount + 1 >= dailyTaskLists[k].taskTimes;
          dailyTaskLists[k].receive = !!isReceive;
        }
      }
    }

    // 角色收集
    if (message.taskType === BlockSevenTaskType.collect) {
      for (let k = 0; k < dailyTaskLists.length; k++) {
        // 判断奖励是否领取
        const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});

        // 判断用户收集角色数
        const roleCount = await BlockRole.count({shortId: user.shortId});
        dailyTaskLists[k].finishCount = roleCount;
        dailyTaskLists[k].finish = roleCount >= dailyTaskLists[k].taskTimes;
        dailyTaskLists[k].receive = !!isReceive;
      }
    }

    // 角色养成
    if (message.taskType === BlockSevenTaskType.cultivate) {
      for (let k = 0; k < dailyTaskLists.length; k++) {
        // 判断奖励是否领取
        const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});

        // 判断用户收集角色数
        const roleCount = await BlockRole.count({shortId: user.shortId, level:
            { $gte: dailyTaskLists[k].taskTimes}});
        dailyTaskLists[k].finishCount = roleCount;
        dailyTaskLists[k].finish = roleCount >= dailyTaskLists[k].taskTimes;
        dailyTaskLists[k].receive = !!isReceive;
      }
    }

    // 关卡闯关
    if (message.taskType === BlockSevenTaskType.curLevel) {
      for (let k = 0; k < dailyTaskLists.length; k++) {
        // 判断奖励是否领取
        const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});

        dailyTaskLists[k].finishCount = user.curLevel > dailyTaskLists[k].taskTimes ? dailyTaskLists[k].taskTimes : user.curLevel - 1;
        dailyTaskLists[k].finish = user.curLevel > dailyTaskLists[k].taskTimes;
        dailyTaskLists[k].receive = !!isReceive;
      }
    }

    // 福利礼包
    if (message.taskType === BlockSevenTaskType.gift) {
      for (let k = 0; k < dailyTaskLists.length; k++) {
        // 判断奖励是否领取
        const receiveCount = await BlockSevenTaskRecord.count({shortId: user.shortId,
          taskId: dailyTaskLists[k].taskId});

        dailyTaskLists[k].finishCount = receiveCount;
        dailyTaskLists[k].finish = receiveCount >= dailyTaskLists[k].payCount;
        dailyTaskLists[k].receive = receiveCount >= dailyTaskLists[k].payCount;
      }
    }

    return {expireTime, registDays, finishTaskCount, totalTaskLists: datas, dailyTaskLists};
  }

  // 每日活跃抽奖
  async draw(player) {
    const lock = await service.utils.grantLockOnce(RedisKey.dailyLottery + player.shortId, 3);
    if (!lock) {
      // 稍后重试
      return { isOk: false };
    }

    // 查找抽奖次数
    if (player.turntableTimes < 1) {
      // 没有抽奖次数了
      await lock.unlock();
      return { isOk: false };
    }

    const list = await BlockTurntablePrize.find({
      // 忽略空奖励
      probability: {
        $gt: 0,
      },
      // 实际数量大于 0
      residueNum: {
        $gt: 0,
      },
    });

    const hitPrize = await this.service.lottery.randomWithNoPrize(list);
    // 抽奖记录
    const record = await this.recordLottery(player._id.toString(), player.shortId,
      hitPrize && hitPrize._id || null);
    // 抽奖次数减一
    player.turntableTimes --;
    await player.save();
    await lock.unlock();
    return { isOk: true, times: player.turntableTimes, record };
  }

  // 记录抽奖记录
  async recordLottery(playerId, shortId, prizeId) {
    // 是否中奖
    const isHit = !!prizeId;
    let conf;
    if (prizeId) {
      conf = await this.getPrize(prizeId);
      if (!conf) {
        // 没有奖品配置
        console.error('no lottery prize', prizeId, playerId, shortId);
        return null;
      }
      // 实际数量-1
      conf.residueNum--;
      await conf.save();
    }

    return await BlockTurntablePrizeRecord.create({
      playerId,
      shortId,
      prizeConfig: conf || null,
      prizeId: conf && conf._id || null,
      createAt: new Date(),
      isHit,
    });
  }

  // 检查奖品是否存在
  async getPrize(prizeId) {
    return await BlockTurntablePrize.findById(prizeId);
  }

  // 今日抽奖次数
  async todayLotteryCount(playerId, shortId) {
    const start = moment().startOf('day').toDate()
    const end = moment().endOf('day').toDate()
    return BlockTurntablePrizeRecord.count({
      playerId,
      shortId,
      createAt: {
        $gte: start,
        $lte: end,
      }
    })
  }

  getPrizeNumber(prize) {
    if (prize.type === BlockOnlinePrizeType.gold) {
      return Math.floor(Math.random() * (prize.number[1] - prize.number[0] + 1) + prize.number[0])
    }

    return prize.number;
  }

  async checkTaskIsFinish(task, user) {
    // 消耗任务
    if (task.taskType === BlockSevenTaskType.consume) {
      const summary = await BlockDiamondRecord.aggregate([
        { $match: { player: user._id.toString(), type: {$in: [1, 2, 5]} } },
        { $group: { _id: null, sum: { $sum: "$amount" } } }
      ]).exec();
      let consumeAmount = 0;
      if (summary.length > 0) {
        consumeAmount = summary[0].sum;
      }

      task.finishCount = consumeAmount;
      task.finish = consumeAmount >= task.taskTimes;

      // 判断任务是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: task.taskId});
      task.receive = !!isReceive;
    }

    // 连续登录任务
    if (task.taskType === BlockSevenTaskType.login) {
      // 判断任务是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: task.taskId});

      // 判断登录任务完成次数
      const loginCount = await BlockSevenTaskRecord.count({shortId: user.shortId,
        "taskConfig.taskType": BlockSevenTaskType.login});
      task.finishCount = loginCount;
      task.finish = loginCount + 1 >= task.taskTimes;
      task.receive = !!isReceive;
    }

    // 角色收集
    if (task.taskType === BlockSevenTaskType.collect) {
      // 判断奖励是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: task.taskId});

      // 判断用户收集角色数
      const roleCount = await BlockRole.count({shortId: user.shortId});
      task.finishCount = roleCount;
      task.finish = roleCount >= task.taskTimes;
      task.receive = !!isReceive;
    }

    // 角色养成
    if (task.taskType === BlockSevenTaskType.cultivate) {
      // 判断奖励是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: task.taskId});

      // 判断用户收集角色数
      const roleCount = await BlockRole.count({shortId: user.shortId, level:
          { $gte: task.taskTimes}});
      task.finishCount = roleCount;
      task.finish = roleCount >= task.taskTimes;
      task.receive = !!isReceive;
    }

    // 关卡闯关
    if (task.taskType === BlockSevenTaskType.curLevel) {
      // 判断奖励是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: task.taskId});

      task.finishCount = user.curLevel > task.taskTimes ? task.taskTimes : user.curLevel - 1;
      task.finish = user.curLevel > task.taskTimes;
      task.receive = !!isReceive;
    }

    // 福利礼包
    if (task.taskType === BlockSevenTaskType.gift) {
      // 判断奖励是否领取
      const receiveCount = await BlockSevenTaskRecord.count({shortId: user.shortId,
        taskId: task.taskId});

      task.finishCount = receiveCount;
      task.finish = receiveCount < task.payCount;
      task.receive = receiveCount >= task.payCount;
    }

    return {finish: task.finish, receive: task.receive};
  }

  async getGiftData(message) {
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()

    const user = await BlockUser.findOne({openid: message.openid});

    if (!user) {
      return false;
    }

    // 新手宝箱
    const newGift = await BlockShop.findOne({giftType: 1, type: 1}).lean();

    // 新手宝箱需要统计累计领取次数，今日是否已领取
    newGift.alreadyReceiveCount = await BlockShopGiftPayRecord.count({giftId: newGift._id,
      playerId: user._id.toString()});
    const isTodayReceive = await BlockShopGiftPayRecord.count({giftId: newGift._id, createAt:
          {$gte: start, $lt: end}, playerId: user._id.toString()});
    newGift.isTodayReceive = !!isTodayReceive;

    // 普通宝箱，prizeLists包含多个数组，表示奖励随机，并且金币奖励number为数组表示区间，普通宝箱有1-10级,暂定不做免费礼包
    const normals = await BlockShop.find({type: 1, giftType: 2, level: user.shopGiftLevel}).lean();

    // 碎片宝箱，prizeLists包含多个数组，表示奖励随机，并且金币奖励number为数组表示区间，普通宝箱有1-10级,暂定不做免费礼包
    const debrises = await BlockShop.find({type: 1, giftType: 3, level: user.shopGiftLevel}).lean();

    // 金币礼包
    const goldGift = await BlockShop.find({type: 2}).lean();
    await Promise.all(goldGift.map(async (gift: any) => {
      if (gift.amount > 0) return;
      gift.todayReceiveCount = await BlockShopGiftPayRecord.count({
        giftId: gift._id,
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      });
    }));

    // 钻石礼包
    const diamondGift = await BlockShop.find({type: 3}).lean();
    await Promise.all(diamondGift.map(async (gift: any) => {
      if (gift.amount > 0) return;
      gift.todayReceiveCount = await BlockShopGiftPayRecord.count({
        giftId: gift._id,
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      });
    }));

    // 体力礼包
    const powerGift = await BlockShop.find({type: 4}).lean();
    await Promise.all(powerGift.map(async (gift: any) => {
      if (gift.amount > 0) return;
      gift.todayReceiveCount = await BlockShopGiftPayRecord.count({
        giftId: gift._id,
        playerId: user._id.toString(),
        createAt: { $gte: start, $lt: end }
      });
    }));

    // 获取最高级别
    const highestLevelGift = await BlockShopGiftLevel.find().sort({ level: -1 }).limit(1);
    const maxLevel = highestLevelGift[0].level;
    const levelInfo = {
      level: user.shopGiftLevel, // 用户等级
      empirical: user.shopGiftEmpirical, // 用户经验
      nextEmpirical: 0, // 下一级需要经验值
      isMaxLevel: true // 是否达到最高等级
    }

    if (user.shopGiftLevel < maxLevel) {
      const nextLevel = await BlockShopGiftLevel.findOne({level: user.shopGiftLevel + 1});
      levelInfo.nextEmpirical = nextLevel.empirical;
      levelInfo.isMaxLevel = false;
    }

    return {newGift, normals, debrises, goldGift, diamondGift, powerGift, levelInfo};
  }

  async getActivityInfo(user) {
    const now = new Date().getTime();

    // 判断在线奖励是否开放
    const receiveCount = await blockOnlinePrizeRecord.count({shortId: user.shortId});
    const onlinePrize = receiveCount < 16;
    const isOnlineReceive = await this.checkOnlinePrizeReceive(user);

    // 判断7日签到是否开放
    const sevenLoginCount = await BlockSevenSignPrizeRecord.count({shortId: user.shortId});
    const sevenLogin = sevenLoginCount < 7;
    const sevenLoginData = await this.getSevenSignLists(user);
    const isSevenLoginReceive = sevenLoginData.isTodaySign;

    // 判断转盘开关
    let turnrable = {
      openTurntable: true,
      turntableDraw: user.turntableTimes > 0
    };
    let startAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveStartAt);
    let endAt = await this.service.utils.getGlobalConfigByName(GlobalConfigKeys.blockTurntableActiveEndAt);
    if (!startAt || !endAt) {
      turnrable.openTurntable = false;
    }

    startAt = new Date(parseInt(startAt, 10));
    endAt = new Date(parseInt(endAt, 10));

    if (startAt.getTime() > now || endAt.getTime() < now) {
      turnrable.openTurntable = false;
    }

    // 获取7日狂欢打点
    const sevenTask = await this.checkSevenTaskReceive(user);
    sevenTask["sevenLogin"] = new Date().getTime() - Date.parse(user.createAt) < 1000 * 60 * 60 * 7;

    //任务打点
    const dailyTask = await this.checkTaskReceive(user);

    // 每日签到打点
    const dailySign = await this.getDailySignData(user);

    const dailySummon = await this.getDailySummonData(user);

    return {online: {onlinePrize, isOnlineReceive}, sevenLogin: {sevenLogin, isSevenLoginReceive: !isSevenLoginReceive}, turnrable, sevenTask, dailyTask, dailySign, dailySummon };
  }

  async getFullUserInfo(u) {
    const user = await BlockUser.findOne({openid: u.openid}).lean();

    if (!user) {
      return this.replyFail(BlockErrorCode.userNotFound);
    }

    user.roles = await BlockRole.find({
      playerId: user._id.toString()
    });

    user.debris = await BlockBackPack.find({
      playerId: user._id.toString(),
      type: BlockBackPackType.debris,
      number: {$gt: 0}
    });

    return user;
  }

  async receivePrize(prize, user, type, multiple = 1) {
    switch (prize.type) {
      case BlockOnlinePrizeType.diamond:
        await BlockUser.update({_id: user._id }, {$inc: { gem: prize.number * multiple }});
        await BlockDiamondRecord.create({
          player: user._id.toString(),
          amount: prize.number * multiple,
          residue: user.gem + prize.number * multiple,
          type: type,
          note: "活动获得钻石"
        });
        break;

      case BlockOnlinePrizeType.gold:
        await BlockUser.update({_id: user._id }, {$inc: { gold: prize.number * multiple }});
        break;

      case BlockOnlinePrizeType.power:
        await BlockUser.update({_id: user._id }, {$inc: { power: prize.number * multiple }});
        break;

      case BlockOnlinePrizeType.prop:
        const propInfo = await this.getBackPackInfo(prize, user);
        propInfo.number += prize.number * multiple;

        propInfo.save();
        break;
    }
  }

  async receiveCurrencyPrize(prize, user, multiple = 1) {
    switch (prize.type) {
      case BlockCurrencyType.gold:
        await BlockUser.update({_id: user._id }, {$inc: { gold: prize.number * multiple }});
        break;

      case BlockCurrencyType.diamond:
        await BlockUser.update({_id: user._id }, {$inc: { gem: prize.number * multiple }});
        break;

      case BlockCurrencyType.power:
        await BlockUser.update({_id: user._id }, {$inc: { power: prize.number * multiple }});
        break;

      case BlockCurrencyType.prop:
        const propInfo = await this.getBackPackInfo(prize, user);
        propInfo.number += prize.number * multiple;

        propInfo.save();
        break;
    }
  }

  async getBackPackInfo(prize, user) {
    const propInfo = await BlockBackPack.findOne({
      propId: prize.propId,
      playerId: user._id.toString(),
      type: BlockBackPackType.debris
    })

    if (propInfo) {
      return propInfo;
    }

    return BlockBackPack.create({
      playerId: user._id.toString(),
      shortId: user.shortId,
      propId: prize.propId,
      type: BlockBackPackType.debris,
      number: 0,
      createAt: new Date(),
    })
  }

  getSevenTaskType(taskType) {
    if (taskType === 1) {
      return [BlockSevenTaskType.consume, BlockSevenTaskType.login];
    }

    return [taskType];
  }

  sortTasks(tasks, type = 1) {
    const sortTasks = [];

    for (const task of tasks) {
      if (task.finish && !task.receive) {
        sortTasks.push(task);
      }
    }

    for (const task of tasks) {
      if (!task.finish && type === 1) {
        sortTasks.push(task);
      }
    }

    for (const task of tasks) {
      if (task.finish && task.receive && type === 1) {
        sortTasks.push(task);
      }
    }

    return sortTasks;
  }

  checkDailyTaskReceive(tasks) {
    let canReceive = false;

    for (const task of tasks) {
      if (task.finish && !task.receive) {
        canReceive = true;
        break;
      }
    }

    return canReceive;
  }

  async getSummonRoleProbability(records) {
    let totalWeight = 0;
    let totalProbability = 0;
    const roles = [];

    records.map((r) => {
      totalWeight += r.weight;
    })

    for (let i = 0; i < records.length; i++) {
      if (i !== records.length - 1) {
        records[i].probability = records[i].weight / totalWeight;
        totalProbability += records[i].probability;
      } else {
        records[i].probability = 1 - totalProbability;
      }

      roles.push(records[i]);
    }

    return roles;
  }

  async getOnlinePrizeLists(user) {
    const prizeList = await BlockPrize.find();
    let times = 0;
    const datas = [];

    for (let i = 0; i < prizeList.length; i++) {
      // 判断是否已领取
      const receive = await blockOnlinePrizeRecord.findOne({shortId: user.shortId, "prizeConfig.times": prizeList[i].times});
      times += prizeList[i].times;
      const data = {
        id: prizeList[i].propId,
        count: prizeList[i].number,
        times,
        prizeId: prizeList[i]._id.toString(),
        receive: !!receive,
      };

      datas.push(data);
    }

    return datas;
  }

  async checkOnlinePrizeReceive(user) {
    const prizeList = await this.getOnlinePrizeLists(user);
    let isReceive = false;

    for (let i = 0; i < prizeList.length; i++) {
      if (user.activityTimes >= prizeList[i].times && !prizeList[i].receive) {
        isReceive = true;
        break;
      }
    }

    return isReceive;
  }

  async getSevenSignLists(user) {
    const prizeList = await BlockSevenSignPrize.find();
    const datas = [];
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const isTodaySign = await BlockSevenSignPrizeRecord.count({shortId: user.shortId,
      createAt: {$gte: start, $lt: end}});
    let days = await BlockSevenSignPrizeRecord.count({shortId: user.shortId});
    if (!isTodaySign) {
      days++;
    }

    for (let i = 0; i < prizeList.length; i++) {
      const receive = await BlockSevenSignPrizeRecord.count({shortId: user.shortId, "prizeConfig.day": prizeList[i].day});
      const data = {
        id: prizeList[i].propId,
        count: prizeList[i].number,
        prizeId: prizeList[i]._id.toString(),
        receive: !!receive
      };

      datas.push(data);
    }

    return {isTodaySign: !!isTodaySign, days, datas};
  }

  async checkSevenTaskReceive(user) {
    const sevenTask = {
      isReceive: false,
      canReceives: []
    };
    // 获取第几天
    const currentTimestamp = Date.now();

    // 计算注册天数
    const diffInSeconds = currentTimestamp - Date.parse(user.createAt);
    const registDays = Math.ceil(diffInSeconds / (1000 * 60 * 60 * 24));

    // 获取每天的任务列表
    const dailyTaskLists = await BlockSevenTask.find({taskType: {$ne: 6}}).lean();

    for (let k = 0; k < dailyTaskLists.length; k++) {
      if (registDays < dailyTaskLists[k].day) {
        continue;
      }

      // 判断任务是否领取
      const isReceive = await BlockSevenTaskRecord.count({shortId: user.shortId, taskId: dailyTaskLists[k].taskId});
      dailyTaskLists[k].receive = !!isReceive;

      // 消耗任务
      if (dailyTaskLists[k].taskType === BlockSevenTaskType.consume) {
        const summary = await BlockDiamondRecord.aggregate([
          { $match: { player: user._id.toString(), type: {$in: [1, 2, 5]} } },
          { $group: { _id: null, sum: { $sum: "$amount" } } }
        ]).exec();
        let consumeAmount = 0;
        if (summary.length > 0) {
          consumeAmount = summary[0].sum;
        }

        dailyTaskLists[k].finishCount = consumeAmount;
        dailyTaskLists[k].finish = consumeAmount >= dailyTaskLists[k].taskTimes;
      }

      // 连续登录任务
      if (dailyTaskLists[k].taskType === BlockSevenTaskType.login) {
        // 判断登录任务完成次数
        const loginCount = await BlockSevenTaskRecord.count({shortId: user.shortId,
          "taskConfig.taskType": BlockSevenTaskType.login});
        dailyTaskLists[k].finishCount = loginCount + 1;
        dailyTaskLists[k].finish = loginCount + 1 >= dailyTaskLists[k].taskTimes;
      }

      if (dailyTaskLists[k].taskType === BlockSevenTaskType.collect) {
        // 判断用户收集角色数
        const roleCount = await BlockRole.count({shortId: user.shortId});
        dailyTaskLists[k].finishCount = roleCount;
        dailyTaskLists[k].finish = roleCount >= dailyTaskLists[k].taskTimes;
      }

      if (dailyTaskLists[k].taskType === BlockSevenTaskType.cultivate) {
        // 判断用户收集角色数
        const roleCount = await BlockRole.count({shortId: user.shortId, level:
              { $gte: dailyTaskLists[k].taskTimes}});
        dailyTaskLists[k].finishCount = roleCount;
        dailyTaskLists[k].finish = roleCount >= dailyTaskLists[k].taskTimes;
      }

      if (dailyTaskLists[k].taskType === BlockSevenTaskType.curLevel) {
        dailyTaskLists[k].finishCount = user.curLevel > dailyTaskLists[k].taskTimes ? dailyTaskLists[k].taskTimes : user.curLevel - 1;
        dailyTaskLists[k].finish = user.curLevel > dailyTaskLists[k].taskTimes;
      }

      if (dailyTaskLists[k].finish && !dailyTaskLists[k].receive) {
        sevenTask.isReceive = true;

        const index = sevenTask.canReceives.findIndex((c) => c.taskType ===
            ([1, 2].includes(dailyTaskLists[k].taskType) ? 1 : dailyTaskLists[k].taskType)
            && c.day === dailyTaskLists[k].day);

        if (index === -1) {
          sevenTask.canReceives.push({day: dailyTaskLists[k].day, taskType: [1, 2].includes(dailyTaskLists[k].taskType) ?
                1 : dailyTaskLists[k].taskType});
        }
      }
    }

    return sevenTask;
  }

  async checkTaskReceive(user) {
    const dailyTask = await this.checkDailyTaskDataFinish(user);

    // 计算活跃度
    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const liveness = await BlockTaskRecord.aggregate([
      { $match: { playerId: user._id.toString(), createAt: {$gte: start, $lt: end} } },
      { $group: { _id: null, sum: { $sum: "$liveness" } } }
    ]).exec();
    let livenessCount = 0;
    if (liveness.length > 0) {
      livenessCount = liveness[0].sum;
    }

    // 获取累计活跃奖励列表
    const totalPrizeList = await BlockTaskTotalPrize.find();

    for (let i = 0; i < totalPrizeList.length; i++) {
      const isReceive = await BlockTaskTotalPrizeRecord.count({playerId: user._id.toString(),
        prizeId: totalPrizeList[i]._id, createAt: {$gte: start, $lt: end}});

      if (isReceive === 0 && livenessCount >= totalPrizeList[i].liveness) {
        dailyTask.isReceive = true;
      }
    }

    return dailyTask;
  }

  async checkDailyTaskDataFinish(user) {
    const tasks = [];
    let isAllFinish = true;
    let finishCount = 0;
    const dailyTask = {
      isReceive: false,
      canReceives: []
    }

    //成就任务
    const receive = await this.getAchievementTaskInfo(user, [BlockTaskType.achievementLoginThree,
      BlockTaskType.achievementWatchAdverNine]);
    if (receive) {
      dailyTask.isReceive = true;
      dailyTask.canReceives.push(BlockTaskTypes.achievement);
    }

    // 添加每日任务
    const dailyTasks = await BlockTask.find({taskType: BlockTaskTypes.daily}).lean();

    // 判断是否完成任务和领取奖励
    for (let i = 0; i < dailyTasks.length; i++) {
      tasks.push(await this.checkTaskFinishAndReceive(dailyTasks[i], user));
    }

    // 判断是否完成所有任务
    for (let i = 0; i < tasks.length - 1; i++) {
      if (!tasks[i].finish) {
        isAllFinish = false;
      } else {
        finishCount++;
      }
    }

    tasks[tasks.length - 1].finish = isAllFinish;
    tasks[tasks.length - 1].finishCount = finishCount;

    for (let i = 0; i < tasks.length - 1; i++) {
      if (tasks[i].finish && !tasks[i].receive) {
        dailyTask.isReceive = true;
        dailyTask.canReceives.push(BlockTaskTypes.daily);
        break;
      }
    }

    return dailyTask;
  }

  async getAchievementTaskInfo(user, taskIds) {
    let receive = false;
    const tasks = await BlockTask.find({taskId: {$gte: taskIds[0], $lte: taskIds[1]}}).lean();

    for (let i = 0; i < tasks.length; i++) {
      const taskInfo = await this.checkTaskFinishAndReceive(tasks[i], user);
      if (taskInfo.finish && !taskInfo.receive) {
        receive = true;
        break;
      }
    }

    return receive;
  }

  async getDailySignData(user) {
    const dailySign = {
      isReceive: false
    }

    const start = moment(new Date()).startOf('day').toDate()
    const end = moment(new Date()).endOf('day').toDate()
    const todaySignCount = await BlockDailySignPrizeRecord.count({shortId: user.shortId,
      createAt: {$gte: start, $lt: end}});
    dailySign.isReceive = todaySignCount === 0;
    const days = await BlockDailySignPrizeRecord.count({shortId: user.shortId});

    // 获取累计活跃奖励列表
    const totalPrizeList = await BlockDailySignTotalPrize.find();

    for (let i = 0; i < totalPrizeList.length; i++) {
      const receiveCount = await BlockDailySignTotalPrizeRecord.count({shortId: user.shortId,
        "prizeConfig.liveness": totalPrizeList[i].liveness});

      if (receiveCount === 0 && days >= totalPrizeList[i].liveness) {
        dailySign.isReceive =true;
      }
    }

    return dailySign;
  }

  async getDailySummonData(user) {
    const summonData = await BlockRoleSummon.find().lean();
    let receive = false;
    const soldierTypes = [];
    const heroTypes = [];

    for (let i = 0; i < summonData.length; i++) {
      // 获取上一次免费召唤记录
      const freeData = await BlockRoleSummonRecord.findOne({playerId: user._id.toString(),
        isFree: true, "summonConfig.roleType": summonData[i].roleType, "summonConfig.summonType": summonData[i].summonType}).sort({createAt: -1});


      // 没有使用过免费召唤，免费召唤超过冷却期
      if ((freeData && Date.parse(freeData.createAt) + 1000 * 60 * 60 * 24 * summonData[i].coolingTime
        < new Date().getTime()) || !freeData) {
        receive = true;

        if (summonData[i].roleType === BlockSummonType.soldier) {
          soldierTypes.push(summonData[i].summonType);
        }

        if (summonData[i].roleType === BlockSummonType.hero) {
          heroTypes.push(summonData[i].summonType);
        }
      }
    }

    return {open: receive, soldierTypes, heroTypes};
  }

  // 支付宝登录
  async getAliGameInfo(code) {
    const data = {
      appId: config.alipay.appid,
      gateway: config.alipay.gateway,
      keyType: config.alipay.keyType,
      alipayPublicKey: fs.readFileSync('aligame-public-key.pem', 'ascii'),
      privateKey: fs.readFileSync('aligame-private-key.pem', 'ascii'),
    };

    // @ts-ignore
    const alipaySdk = new AlipaySdk(data);

    try {
      const result = await alipaySdk.exec("alipay.system.oauth.token", {
        code: code,
        grant_type: "authorization_code"
      });

      const userInfo = await alipaySdk.exec("alipay.user.info.share", {
        auth_token: result.accessToken,
        bizContent: {}
      });

      return userInfo;
    } catch(e) {
      console.log(e.serverResult)
      return false;
    }
  }

  async wxLogin(message) {
    // 微信小程序登录
    const resp = await service.wechat.getWechatInfoByQuickApp(config.wechat.blockQuickAppId,
      config.wechat.blockQuickSecret, message.code);

    if (!resp) {
      return this.replyFail(BlockErrorCode.codeInvalid);
    }

    const user = await BlockUser.findOne({openid: resp.openid});
    const shortId = await getBlockNewShortUserId()
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    const defaultAvatar = `https://phpadmin.tianle.fanmengonline.com/uploads/images/avatars/${avatarIndex}.png`;

    const data = {
      openid: resp.openid,
      shortId,
      gem: 0,
      gold: 0,
      sessionKey: resp.session_key,
      avatar: defaultAvatar,
      nickname: `用户${shortId}`,
      location: UserRegistLocation.wechat,
      ip: message.ip
    }

    return await this.checkUserRegist(user, data);
  }

  async aliLogin(message) {
    const resp = await this.getAliGameInfo(message.code);

    if (!resp || resp.code !== '10000') {
      return this.replyFail(BlockErrorCode.codeInvalid);
    }

    const user = await BlockUser.findOne({openid: resp.userId});
    const shortId = await getBlockNewShortUserId()
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    const defaultAvatar = `https://phpadmin.tianle.fanmengonline.com/uploads/images/avatars/${avatarIndex}.png`;

    const data = {
      openid: resp.userId,
      shortId,
      gem: 0,
      gold: 0,
      sessionKey: null,
      avatar: resp.avatar ? resp.avatar : defaultAvatar,
      nickname: resp.nickName ? resp.nickName : `用户${shortId}`,
      location: UserRegistLocation.aliGame,
      ip: message.ip
    }

    return await this.checkUserRegist(user, data);
  }

  calcConsumeGold(role, config) {
    let consumeGold = 0;
    for (let i = 2; i <= role.level; i++) {
      const gold = (config.lvCost + config.lvCost * (((i - 1 - 1) * config.lvCostRate)));
      consumeGold += gold;
    }

    return consumeGold;
  }

  async appLogin(message) {
    const resp = await service.wechat.getWechatInfoByQuickApp(config.wx.dreamApp.appId, config.wx.dreamApp.quickSecret,
      message.code);

    if (!resp) {
      return this.replyFail(BlockErrorCode.codeInvalid);
    }

    const user = await BlockUser.findOne({openid: resp.openid});
    const shortId = await getBlockNewShortUserId();
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    const defaultAvatar = `https://phpadmin.tianle.fanmengonline.com/uploads/images/avatars/${avatarIndex}.png`;

    const data = {
      openid: resp.openid,
      shortId,
      gem: 0,
      gold: 0,
      sessionKey: null,
      avatar: defaultAvatar,
      nickname: `用户${shortId}`,
      location: UserRegistLocation.app,
      ip: message.ip
    }

    return await this.checkUserRegist(user, data);
  }

  async qqLogin(message) {
    const resp = await service.wechat.getQqInfoBycode(config.qqGame.appId,
        config.qqGame.secret, message.code);

    if (!resp) {
      return this.replyFail(BlockErrorCode.codeInvalid);
    }

    const user = await BlockUser.findOne({openid: resp.openid});
    const shortId = await getBlockNewShortUserId()
    const avatarIndex = Math.floor(Math.random() * 12) + 1;
    const defaultAvatar = `https://phpadmin.tianle.fanmengonline.com/uploads/images/avatars/${avatarIndex}.png`;

    const data = {
      openid: resp.openid,
      shortId,
      gem: 0,
      gold: 0,
      sessionKey: resp.session_key,
      avatar: defaultAvatar,
      nickname: `用户${shortId}`,
      location: UserRegistLocation.qqGame,
      ip: message.ip
    }

    return await this.checkUserRegist(user, data);
  }

  async checkUserRegist(user, data) {
    if (user) {
      // 判断昨日是否登录
      const start = moment().subtract(1, 'day').startOf('day').toDate();
      const end = moment().subtract(1, 'day').endOf('day').toDate();
      const today_start = moment(new Date()).startOf('day').toDate();
      const today_end = moment(new Date()).endOf('day').toDate();
      const yestodayLoginCount = await BlockLoginRecord.count({createAt:
            {$gte: start, $lt: end}, playerId: user._id.toString()});
      const todayLoginCount = await BlockLoginRecord.count({createAt:
            {$gte: today_start, $lt: today_end}, playerId: user._id.toString()});
      if(yestodayLoginCount === 0) {
        user.consecutiveLoginDays = 1;
      }
      if (yestodayLoginCount > 0 && todayLoginCount === 0) {
        user.consecutiveLoginDays++;
      }

      // 判断是否有省市ip信息
      if (!user.province || !user.city || !user.ip) {
        const result = await this.player.getLocation();
        if (result.code === 200) {
          user.province = result.data.result.prov;
          user.city = result.data.result.city;
          user.ip = this.player.getIpAddress();
        }
      }

      await user.save();

      if (todayLoginCount === 0) {
        await BlockLoginRecord.create({
          playerId: user._id.toString(),
          shortId: user.shortId
        })
      }
    } else {
      const result = await this.player.getLocation();
      if (result.code === 200) {
        data["province"] = result.data.result.prov;
        data["city"] = result.data.result.city;
      }
      const record = await BlockUser.create(data);

      const roleData = {
        playerId: record._id,
        shortId: record.shortId,
        roleId: 1001,
        level: 1,
        selected: true
      }

      await BlockRole.create(roleData);
    }

    const replyData = await BlockUser.findOne({openid: data.openid}).lean();
    replyData.roles = await BlockRole.find({
      playerId: replyData._id.toString()
    })

    replyData.debris = await BlockBackPack.find({
      playerId: replyData._id.toString(),
      type: BlockBackPackType.debris
    })

    return replyData;
  }

  async finishDailyTaskOnce(message, user) {
    // 获取任务配置
    const taskInfo = await BlockTask.findOne({taskId: message.taskId}).lean();
    const tasks = [];
    let isAllFinish = true;
    let finishCount = 0;

    if (!taskInfo) {
      return this.replyFail(BlockErrorCode.configNotFound);
    }

    // 根据不同任务类型判断是否完成任务
    const taskResult = await this.checkTaskFinishAndReceive(taskInfo, user);

    // 如果是每日任务的完成所有任务,判断任务是否完成
    if (taskResult.taskId === BlockTaskType.dailyFinishAllTask) {
      const taskLists = await BlockTask.find({taskType: BlockTaskTypes.daily, taskId: {$ne: BlockTaskType.dailyFinishAllTask}}).lean();

      // 判断是否完成任务和领取奖励
      for (let i = 0; i < taskLists.length; i++) {
        tasks.push(await this.checkTaskFinishAndReceive(taskLists[i], user));
      }

      // 判断是否完成所有任务
      for (let i = 0; i < tasks.length; i++) {
        if (!tasks[i].finish) {
          isAllFinish = false;
        } else {
          finishCount++;
        }
      }

      taskResult.finish = isAllFinish;
      taskResult.finishCount = finishCount;
    }

    if (!taskResult.finish) {
      return this.replyFail(BlockErrorCode.taskNotFinish);
    }

    if (taskResult.receive) {
      return this.replyFail(BlockErrorCode.prizeIsReceive);
    }

    // 按照奖励类型领取奖励
    for (let i = 0; i < taskInfo.prizeList.length; i++) {
      const prizeInfo = taskInfo.prizeList[i];
      await this.receiveCurrencyPrize(prizeInfo, user, message.multiple);

      if (prizeInfo.type === BlockCurrencyType.diamond) {
        await BlockDiamondRecord.create({
          player: user._id.toString(),
          amount: prizeInfo.number * message.multiple,
          residue: user.gem + prizeInfo.number * message.multiple,
          type: BlockDiamondLogType.giveByTask,
          note: "任务获得"
        });
      }
    }

    // 创建领取记录
    const data = {
      playerId: user._id.toString(),
      shortId: user.shortId,
      taskId: taskInfo.taskId,
      liveness: taskInfo.liveness,
      taskConfig: taskInfo,
      createAt: new Date()
    };

    const record = await BlockTaskRecord.create(data);

    const taskData = await this.getDailyTaskData(message, user);

    return {record: record, recordList: [record], taskData};
  }

  async finishDailyTaskAll(message, user) {
    const taskLists = await this.getDailyTaskDataByType(message, user);
    const sortTasks = this.sortTasks(taskLists, 2);
    const records = [];

    await Promise.all(sortTasks.map(async (taskInfo: any) => {
      if (!taskInfo.finish || taskInfo.receive) {
        return;
      }

      for (let i = 0; i < taskInfo.prizeList.length; i++) {
        const prizeInfo = taskInfo.prizeList[i];
        await this.receiveCurrencyPrize(prizeInfo, user, message.multiple);

        if (prizeInfo.type === BlockCurrencyType.diamond) {
          await BlockDiamondRecord.create({
            player: user._id.toString(),
            amount: prizeInfo.number * message.multiple,
            residue: user.gem + prizeInfo.number * message.multiple,
            type: BlockDiamondLogType.giveByTask,
            note: "任务获得"
          });
        }
      }

      // 创建领取记录
      const data = {
        playerId: user._id.toString(),
        shortId: user.shortId,
        taskId: taskInfo.taskId,
        liveness: taskInfo.liveness,
        multiple: message.multiple,
        taskConfig: taskInfo,
        createAt: new Date()
      };

      const record = await BlockTaskRecord.create(data);
      records.push(record);
    }));

    const taskData = await this.getDailyTaskData(message, user);

    return {recordList: records, taskData};
  }

}
