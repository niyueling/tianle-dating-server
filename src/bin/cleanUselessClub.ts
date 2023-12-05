import * as moment from "moment";
import Club from "../database/models/club";
import RoomRecord from "../database/models/roomRecord";
import ClubMember from "../database/models/clubMember";

// 删除一个月没活动的俱乐部
async function cleanUselessClub() {
  const fiftyyDayBefore = moment().subtract(50, 'days').startOf('day').toDate()
  // 查找一个月前创建的俱乐部
  const record = await Club.find({createAt: {$lt: fiftyyDayBefore}}).exec();
  for(const club of record){
    // 查找一个月内的房间记录
    const count = await RoomRecord.count({club: club._id, createAt: {$gte: fiftyyDayBefore}});
    if (count > 0) {
      continue;
    }
    console.log('delete club', club._id);
    // 删除俱乐部，删除成员
    await ClubMember.remove({club: club._id})
    await club.remove()
  }
}

export default cleanUselessClub
