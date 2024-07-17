import * as moment from 'moment'
import * as mongoose from 'mongoose'
import * as config from '../config'
import ActivePlayerSummary from '../database/models/activePlayer'
import Player from "../database/models/player";
import RoomRecord from '../database/models/roomRecord'
import {UserActivityLogModel, UsersCountLogModel} from "../database/models/userActivityLog";

async function aggregateActivePlayerRecord(day: Date = new Date()) {
  const start = moment(day).startOf('day').toDate()
  const end = moment(day).endOf('day').toDate()
  const roomPlayerIds = [];
  const notRobotPlayerIds = [];
  const roomRecords = await RoomRecord.find({createAt: {$gte: start, $lt: end}, scores: {$ne: []}});

  // 根据playerId去重
  for (let i = 0; i < roomRecords.length; i++) {
    const record = roomRecords[i];
    for (let j = 0; j < record.players.length; j++) {
      const playerId = record.players[j];
      if (playerId && !roomPlayerIds.includes(playerId)) {
        roomPlayerIds.push(playerId);
      }
    }
  }

  // 筛选出非机器人
  for (let i = 0; i < roomPlayerIds.length; i++) {
    const player = await Player.findOne({_id: roomPlayerIds[i]});

    if (player && !player.robot) {
      notRobotPlayerIds.push(roomPlayerIds[i]);
    }
  }

  // 记录访问量
  await ActivePlayerSummary.update({
    day: start,
  }, {
    $set: {
      players: notRobotPlayerIds.length
    }
  }, {upsert: true})

  const summaryInCategory = await RoomRecord.aggregate()
    .match({createAt: {$gte: start, $lt: end}, scores: {$ne: []}})
    .project({players: 1, category: 1, _id: 0})
    .unwind('players')
    .group({_id: '$category', playersId: {$addToSet: '$players'}})
    .project({playersCounter: {$size: '$playersId'}})
    .exec()

  for (const s of summaryInCategory) {
    await UserActivityLogModel.update({day: start, category: s._id}, {
      $set: {count: s.playersCounter}
    }, {upsert: true})
  }

  const playerCounter = await Player.count({})
  await UsersCountLogModel.update({day: start}, {$set: {count: playerCounter}}, {upsert: true})
}

export default aggregateActivePlayerRecord

if (!module.parent) {
  mongoose.connect(config.database.url)
  const dateString = process.argv[2]

  console.log(`querying for date`, moment(new Date(dateString)).startOf('day'));

  aggregateActivePlayerRecord(new Date(dateString))
    .catch(error => {
      console.error('Got', error)
    })
    .then(() => {
      process.exit()
    })
}
