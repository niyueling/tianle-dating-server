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

  const summary = await RoomRecord.aggregate()
    .match({createAt: {$gte: start, $lt: end}})
    .project({players: 1, _id: 0})
    .unwind('players')
    .group({_id: '', playersId: {$addToSet: '$players'}})
    .project({playersCounter: {$size: '$playersId'}})
    .exec()

  for (const s of summary) {
    await ActivePlayerSummary.update({
      day: start,
    }, {
      $set: {
        players: s.playersCounter
      }
    }, {upsert: true})
  }

  const summaryInCategory = await RoomRecord.aggregate()
    .match({createAt: {$gte: start, $lt: end}})
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
  console.log(start, {playerCounter})
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
