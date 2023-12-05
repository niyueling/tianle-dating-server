import * as moment from 'moment'
import * as mongoose from 'mongoose'
import * as config from '../config'
import RechargeSummary from '../database/models/rechargeSummary'
import ExtRecord from '../database/models/userRecord'

async function aggregateRechargeRecord(day: Date = new Date()) {
  const start = moment(day).startOf('day').toDate()
  const end = moment(day).endOf('day').toDate()

  const summary = await ExtRecord.aggregate()
    .match({created: {$gte: start, $lt: end}})
    .group({_id: '$source', sum: {$sum: '$amount'}, count: {$sum: 1}})
    .exec()

  for (const s of summary) {
    console.log(start, s)
    await RechargeSummary.update({
      day: start,
      type: s._id
    }, {
      $set: {
        recharges: s.count,
        sum: s.sum
      }
    }, {upsert: true})
  }
}

export default aggregateRechargeRecord

if (!module.parent) {
  mongoose.connect(config.database.url)
  const dateString = process.argv[2]
  console.log(`querying for date`, moment(new Date(dateString)).startOf('day'));
  aggregateRechargeRecord(new Date(dateString))
    .catch(error => {
      console.error('Got', error)
    })
    .then(() => {
      process.exit()
    })
}
