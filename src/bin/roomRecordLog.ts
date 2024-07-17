import * as moment from 'moment'
import * as mongoose from 'mongoose'
import * as config from '../config'
import {RoomCountLogModel} from "../database/models/RoomCountLog";
import RoomRecord from "../database/models/roomRecord"

async function count(day: string) {

  const from = moment(day).startOf('day').toDate()
  const end = moment(day).endOf('day').toDate()

  const result = await RoomRecord.aggregate([
    {$match: {createAt: {$gt: from, $lte: end}, scores: {$ne: []}}},
    {$project: {category: `$category`, _id: 0}},
    {$group: {_id: `$category`, count: {$sum: 1}}}
  ])

  console.error(result)

  await RoomCountLogModel.remove({day: from})
  await RoomCountLogModel.create(result.map(r => ({category: r._id, count: r.count, day: from})))

  console.error('done')
}

export default count

if (!module.parent) {
  mongoose.connect(config.database.url)
  count(process.argv[2])
    .catch(e => {
      console.error(e)
    })
    .then(() => mongoose.disconnect())

}
