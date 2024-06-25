import {ConsumeLogType, GameType, GlobalConfigKeys, TianleErrorCode} from "@fm/common/constants";
import RoomRecord from "../../database/models/roomRecord";
import {addApi, BaseApi} from "./baseApi";
import moment = require("moment");
import CombatGain from "../../database/models/combatGain";
import GameRecord from "../../database/models/gameRecord";
import {service} from "../../service/importService";

const getGameName = {
  [GameType.mj]: '十二星座',
  [GameType.xueliu]: '血流红中',
  [GameType.pcmj]: '浦城麻将',
  [GameType.xmmj]: '厦门麻将',
  [GameType.guobiao]: '国标血流'
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
    console.warn("gameName-%s, category-%s, getGameName-%s", gameName, result.category, JSON.stringify(getGameName));
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
    const roomRecord = await CombatGain.find({playerId: this.player.model._id, time: {$gte: startTime, $lt: endTime}}).sort({time: -1})

    return this.replySuccess(roomRecord);
  }

  // 求签
  @addApi()
  async blessQian() {
    const todayQian = await service.qian.getTodayQian(this.player.model.shortId);
    // 第一次求签消耗房卡
    const firstCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.firstQianCostGem) || 100;
    // 改签消耗房卡
    const changeCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.changeQianCostGem) || 200;
    // 下次求签消耗
    if (!todayQian.isFirst) {
      let needGem;
      if (todayQian.record) {
        // 改签
        needGem = changeCost;
      } else {
        needGem = firstCost;
      }
      // 检查房卡
      const result = await service.playerService.logAndConsumeDiamond(this.player.model._id, ConsumeLogType.blessQian,
        needGem, '抽签扣钻石')
      if (!result.isOk) {
        return this.replyFail(TianleErrorCode.blessQianFail);
      }
      this.player.model = result.model;
      await this.player.updateResource2Client();
    }
    const newQian = await service.qian.createQian(this.player.model.shortId);
    await service.qian.saveQian(this.player.model.shortId, newQian)
    this.replySuccess({record: newQian, qianCost: changeCost});
  }

  // 进入求签界面
  @addApi({})
  async enterQian() {
    const resp = {
      // 今日签文
      record: null,
      // 求签钻石
      qianCost: 0,
    };
    const todayQian = await service.qian.getTodayQian(this.player.model.shortId);
    if (todayQian.record) {
      resp.record = todayQian.record;
      // 获取改签需要的钻石
      resp.qianCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.changeQianCostGem) || 200;
      resp.qianCost = parseInt(resp.qianCost.toString(), 10);
    } else {
      resp.record = null;
      if (todayQian.isFirst) {
        resp.qianCost = 0;
      } else {
        // 当天第一次抽签
        resp.qianCost = await service.utils.getGlobalConfigByName(GlobalConfigKeys.firstQianCostGem) || 100;
        resp.qianCost = parseInt(resp.qianCost.toString(), 10);
      }
    }
    this.replySuccess(resp);
  }
}
