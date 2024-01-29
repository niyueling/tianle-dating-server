import {GameType} from "@fm/common/constants";
import RoomRecord from "../../database/models/roomRecord";
import {addApi, BaseApi} from "./baseApi";
import moment = require("moment");
import {service} from "../../service/importService";
import GameCategory from "../../database/models/gameCategory";

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
    const roomRecord = await RoomRecord.find({creatorId: this.player.model.shortId, createAt: {$gte: startTime, $lt: endTime}})
    const datas = [];

    for (let i = 0; i< roomRecord.length; i++) {
      const category = await GameCategory.findOne({_id: roomRecord[i].rule.categoryId}).lean();
      const index = roomRecord[i].scores.findIndex(s => s.shortId === this.player.model.shortId)
      datas.push({
        uid: roomRecord[i].roomNum,
        room: roomRecord[i].room,
        gameName: "十二星座",
        caregoryName: category.title,
        score: roomRecord[i].scores[index].score
      })
    }

    return this.replySuccess(datas);
  }
}
