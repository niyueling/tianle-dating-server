import * as moment from 'moment'
import * as mongoose from 'mongoose'
import * as config from '../config'
import ClubModel from "../database/models/club"
import ClubRoomRecordModel from "../database/models/clubRoomRecord"
import RoomRecordModel from "../database/models/roomRecord"

async function saveClubRoomInfo(day: string) {

  const from = moment(day).startOf('day').toDate()
  const end = moment(day).endOf('day').toDate()
  const allClubs = await ClubModel.find({}).lean()

  for (let i = 0; i < allClubs.length; i++) {
    const currentClubId = allClubs[i]._id
    const gameType = allClubs[i].gameType
    const roomRecord = await RoomRecordModel.find({club: currentClubId, createAt: {$gt: from, $lte: end}}).lean()
    const roomInfo = {}
    const allRoomCount = roomRecord.length
    if (roomRecord && allRoomCount > 0) {
      roomInfo['useless'] = {
        times: allRoomCount,
        ruleJu: -1
      }
      roomRecord.forEach(d => {
        if (d.roomState !== 'zero_ju') {
          getRoomInfo(roomInfo, d.rule, gameType)
        }
      })
      const r = await ClubRoomRecordModel.create({
        club: currentClubId,
        gameType,
        roomInfo,
        received: false,
      })
    }
  }

  console.error('club room record done')
}

function getRoomInfo(roomInfo, rule, gameType = 'zhadan') {
  const ruleJu = rule && rule.juShu
  const playerCount = rule && rule.playerCount || 0
  if (gameType === 'zhadan' || gameType === 'biaofen') {
    if (ruleJu === 8) {
      if (roomInfo[8]) {
        roomInfo[8].times += 1
      } else {
        roomInfo[8] = {
          times: 1,
          ruleJu: 8
        }
      }
      roomInfo['useless'].times -= 1
    }
    if (ruleJu === 12) {
      if (roomInfo[12]) {
        roomInfo[12].times += 1
      } else {
        roomInfo[12] = {
          times: 1,
          ruleJu: 12
        }
      }
      roomInfo['useless'].times -= 1
    }
  }
  if (gameType === 'paodekuai') {
    if (ruleJu === 12) {
      if (roomInfo[12]) {
        roomInfo[12].times += 1
      } else {
        roomInfo[12] = {
          times: 1,
          ruleJu: 12
        }
      }
      roomInfo['useless'].times -= 1
    }
    if (ruleJu === 18) {
      if (roomInfo[18]) {
        roomInfo[18].times += 1
      } else {
        roomInfo[18] = {
          times: 1,
          ruleJu: 18
        }
      }
      roomInfo['useless'].times -= 1
    }
  }
  if (gameType === 'majiang' && playerCount === 4) {
    if (ruleJu === 12) {
      if (roomInfo[12]) {
        roomInfo[12].times += 1
      } else {
        roomInfo[12] = {
          times: 1,
          ruleJu: 12
        }
      }
      roomInfo['useless'].times -= 1
    }
  }
}

export default saveClubRoomInfo

if (!module.parent) {
  mongoose.connect(config.database.url)
  saveClubRoomInfo(process.argv[2])
    .catch(e => {
      console.error(e)
    })
    .then(() => mongoose.disconnect())

}
