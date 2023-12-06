import {GameType} from "@fm/common/constants";
import RoomRecord from "../../database/models/roomRecord";
import {addApi, BaseApi} from "./baseApi";

const getGameName = {
  [GameType.zd]: '浦城炸弹',
  [GameType.bf]: '浦城标分',
  [GameType.mj]: '浦城麻将',
  [GameType.pdk]: '浦城跑得快',
  [GameType.sss]: '城市大菠萝',
}

// 游戏配置
export class GameApi extends BaseApi {
  // 获取金豆房配置
  @addApi()
  async getPublicRoomCategory() {
    const resp = await this.service.gameConfig.getPublicRoomCategory();
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
}
