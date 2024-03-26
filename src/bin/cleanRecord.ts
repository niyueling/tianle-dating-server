import * as moment from 'moment'
import GameRecord from '../database/models/gameRecord'
import GmNoteModel from "../database/models/gmNote";
import RoomRecord from '../database/models/roomRecord'
import GoldRecord from "../database/models/goldRecord";

async function cleanRecord() {
  const sevenDayBefore = moment().subtract(7, 'days').startOf('day').toDate()
  const fiftyDayBefore = moment().subtract(50, 'days').startOf('day').toDate()
  await GameRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await GoldRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await RoomRecord.remove({createAt: {$lt: fiftyDayBefore}}).exec()
  await GmNoteModel.remove({createAt: {$lt: sevenDayBefore}}).exec()
}

export default cleanRecord
