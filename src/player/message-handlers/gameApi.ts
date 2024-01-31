import {GameType} from "@fm/common/constants";
import RoomRecord from "../../database/models/roomRecord";
import {addApi, BaseApi} from "./baseApi";
import moment = require("moment");
import {service} from "../../service/importService";
import GameCategory from "../../database/models/gameCategory";
import CombatGain from "../../database/models/combatGain";

const getGameName = {
  [GameType.mj]: '浦城麻将'
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
    const result = await RoomRecord.findOne({ roomNum: message.roomNum.toString() });
    let players = [];
    if (result && result.scores) {
      // 过滤 null,从大到小排列
      players = result.scores.filter(value => value).sort((a, b) => {
        return b.score - a.score;
      })
    }
    let gameName = '';
    if (result && result.category) {
      gameName = getGameName[result.category];
    }
    const resp = {
      roomNum: message.roomNum,
      // 玩家列表
      players,
      // 总局数
      juIndex: result && result.juIndex || 0,
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
}
