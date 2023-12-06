import {prop, Typegoose} from 'pshu-typegoose'

// 房间详情
class RoomDetail extends Typegoose {
  // 房间号
  @prop({required: true})
  roomId: number

  // 所有信息
  @prop({required: true})
  detail: string
}

export const RoomDetailModel = new RoomDetail().getModelForClass(RoomDetail)

// 保存房间信息
export async function saveRoomDetail(roomId: number, detail: string) {
  let m = await RoomDetailModel.findOne({ roomId });
  if (m) {
    m.detail = detail;
    return m.save();
  }
  m = new RoomDetailModel({
    roomId,
    detail,
  });
  return m.save();
}
