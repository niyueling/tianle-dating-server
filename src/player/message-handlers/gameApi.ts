import {
  ConsumeLogType,
  GameType,
  GlobalConfigKeys,
  TianleErrorCode,
  playerAttributes,
  shopPropType
} from "@fm/common/constants";
import RoomRecord from "../../database/models/roomRecord";
import {addApi, BaseApi} from "./baseApi";
import moment = require("moment");
import CombatGain from "../../database/models/combatGain";
import GameRecord from "../../database/models/gameRecord";
import {service} from "../../service/importService";
import LuckyBless from "../../database/models/luckyBless";

const getGameName = {
  [GameType.mj]: '十二星座',
  [GameType.xueliu]: '血流红中',
  [GameType.pcmj]: '浦城麻将',
  [GameType.xmmj]: '厦门麻将',
  [GameType.guobiao]: '国标血流',
  [GameType.zd]: '浦城炸弹',
  [GameType.ddz]: '斗地主',
  [GameType.guandan]: '天乐掼蛋'
}

// 游戏配置
export class GameApi extends BaseApi {
  // 获取金豆房配置
  @addApi({
    rule: {
      gameType: 'string'
    }
  })
  async getPublicRoomCategory(message) {
    const resp = await this.service.gameConfig.getPublicRoomCategory(message);
    this.replySuccess(resp);
  }

  // 战绩分享
  @addApi({
    rule: {
      // 房间号
      roomNum: 'string',
    }
  })
  async shareRecord(message) {
    const result = await RoomRecord.findOne({ roomNum: Number(message.roomNum) });
    const gameRecords = await GameRecord.find({ roomId: message.roomNum.toString() }).sort({juShu: 1});
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

    let gameName = result.category;

    if (result && result.category) {
      gameName = getGameName[result.category];
    }

    const resp = {
      roomNum: message.roomNum,
      // 玩家列表
      players,
      rule: result.rule,
      // 创建时间
      createAt: result && result.createAt || new Date(),
      // 游戏名称
      gameName,
    };
    this.replySuccess(resp);
  }

  @addApi({
    rule: {
      day: "number"
    }
  })
  async recordList(msg) {
    const startTime = moment().subtract(msg.day, 'days').startOf('day').toDate();
    const endTime = moment().subtract(msg.day, 'days').endOf('day').toDate();
    const params = {playerId: this.player.model._id, time: {$gte: startTime, $lt: endTime}};
    if (msg.gameType) {
        params["category"] = msg.gameType;
    }

    const roomRecord = await CombatGain.find(params).sort({time: -1})

    return this.replySuccess(roomRecord);
  }

  // 祈福列表
  @addApi()
  async getBlessList() {
    const blessList = await service.qian.blessList(this.player);
    this.replySuccess(blessList);
  }

  // 钻石祈福
  @addApi()
  async blessByGem(message) {
    const list = await LuckyBless.find().sort({orderIndex: 1});
    const blessIndex = list.findIndex(bless => bless._id.toString() === message._id);
    const bless = list[blessIndex];
    if (!bless) {
      console.error(`no such bless ${message._id}`);
      return this.replyFail(TianleErrorCode.blessFail);
    }
    let index;
    if (message.isUseItem) {
      // 使用道具祈福，默认只祈福第一级
      index = 0;
      const isOk = await service.item.useItem(this.player._id, shopPropType.qiFuCard, 1, bless.orderIndex);
      if (!isOk) {
        return this.replyFail(TianleErrorCode.propInsufficient)
      }
    } else {
      // 钻石祈福
      index = bless.times.indexOf(message.times);
      if (index === -1) {
        console.error(`no such times ${message.times}`);
        return this.replyFail(TianleErrorCode.blessFail)
      }
      let needGem = 0;
      // 更新祈福时长
      const lastBless = await service.playerService.getPlayerAttrValueByShortId(this.player.model.shortId, playerAttributes.blessEndAt, message._id);
      if (lastBless) {
        // 不是第一次，要扣钻石
        needGem = bless.gem[index];
      }
      if (needGem > 0) {
        const result = await service.playerService.logAndConsumeDiamond(this.player.model._id, ConsumeLogType.bless, needGem, '祈福扣钻石')
        if (!result.isOk) {
          return this.replyFail(TianleErrorCode.blessFail)
        }
        this.player.model = result.model;
      }
    }
    await service.playerService.createOrUpdatePlayerAttr(this.player.model._id, this.player.model.shortId, playerAttributes.blessEndAt, Math.floor(Date.now() / 1000), message._id);
    const model = await service.qian.saveBlessLevel(this.player.model.shortId, message.roomId, index + 1);
    // this.blessLevel[player.model.shortId] = model.blessLevel;
    this.replySuccess({ index: blessIndex, blessLevel: model.blessLevel });
    await this.player.updateResource2Client();
  }

  // 求签
  @addApi()
  async blessQian(msg) {
    const todayQian = await service.qian.getTodayQian(this.player.model.shortId);
    // 第一次求签消耗房卡
    const firstCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.firstQianCostGem) || 10;
    // 改签消耗房卡
    const changeCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.changeQianCostGem) || 20;
    // 下次求签消耗
    if (!todayQian.isFirst) {
      let needGem;
      if (todayQian.record) {
        // 改签
        needGem = changeCost;
      } else {
        needGem = firstCost;
      }
      if (msg.isUseItem) {
        // 使用道具求签
        const isOk = await service.item.useItem(this.player._id, shopPropType.qiuqianCard, 1)
        if (!isOk) {
          return this.replyFail(TianleErrorCode.propInsufficient);
        }
      } else {
        // 检查房卡
        const result = await service.playerService.logAndConsumeDiamond(this.player.model._id, ConsumeLogType.blessQian, needGem, '抽签扣钻石')
        if (!result.isOk) {
          return this.replyFail(TianleErrorCode.blessQianFail);
        }
        this.player.model = result.model;
        await this.player.updateResource2Client();
      }
    }
    const newQian = await service.qian.createQian(this.player.model.shortId);
    await service.qian.saveQian(this.player.model.shortId, newQian)

    const itemCount = await service.item.getItemCount(this.player._id, shopPropType.qiuqianCard);
    this.replySuccess({ record: newQian, qianCost: changeCost, itemCount });
  }

  // 进入求签界面
  @addApi({})
  async enterQian() {
    const resp = await service.qian.qianList(this.player);
    this.replySuccess(resp);
  }
}
