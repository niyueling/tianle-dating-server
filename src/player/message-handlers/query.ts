import {RoomInfoModel} from "../../database/models/roomInfo";
import {addApi, BaseApi} from "./baseApi";
import {TianleErrorCode} from "@fm/common/constants";
import {service} from "../../service/importService";
import ClubMember from "../../database/models/clubMember";

// 查询接口
export class QueryApi extends BaseApi {
    // 根据 roomId 查询游戏类型
    @addApi({
        apiName: 'gameType',
        rule: {roomId: 'number'},
    })
    async getGameTypeByRoomId(message) {
        const res = await RoomInfoModel.findOne({roomId: message.roomId});
        if (!res) {
            return this.replyFail(TianleErrorCode.roomInvalid);
        }

        let playerCount = await service.roomRegister.getRoomJoinCount(message.roomId);
        let roomInfo = await RoomInfoModel.findOne({roomId: message.roomId});
        if (!roomInfo) {
            return this.replyFail(TianleErrorCode.roomInvalid);
        }

        if (roomInfo.clubId) {
            let clubMember = await ClubMember.findOne({club: roomInfo.clubId, member: this.player._id});
            if (!clubMember) {
                return this.replyFail(TianleErrorCode.notClubMember);
            }
        }

        return this.replySuccess({gameType: res.gameType, playerCount})
    }
}
