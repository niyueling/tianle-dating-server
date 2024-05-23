import {RoomInfoModel} from "../../database/models/roomInfo";
import {addApi, BaseApi} from "./baseApi";
import {TianleErrorCode} from "@fm/common/constants";
import {service} from "../../service/importService";

// 查询接口
export class QueryApi extends BaseApi {
  // 根据 roomId 查询游戏类型
  @addApi({
    apiName: 'gameType',
    rule: {roomId: 'number'},
  })
  async getGameTypeByRoomId(message) {
    const res = await RoomInfoModel.findOne({roomId: message.roomId});
    if (res) {
      let playerCount = await service.roomRegister.getRoomJoinCount(message.roomId);
      return this.replySuccess({gameType: res.gameType, playerCount})
    }

    return this.replyFail(TianleErrorCode.roomInvalid);
  }
}
