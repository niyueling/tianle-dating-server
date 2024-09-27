import * as moment from 'moment'
import CombatGain from "../database/models/combatGain";
import GameCardRecord from "../database/models/gameCardRecord";
import GameRecord from '../database/models/gameRecord'
import GmNoteModel from "../database/models/gmNote";
import GoldRecord from "../database/models/goldRecord";
import RoomRecord from '../database/models/roomRecord'
import RoomScoreRecord from "../database/models/roomScoreRecord";

async function cleanRecord() {
  const sevenDayBefore = moment().subtract(7, 'days').startOf('day').toDate()
  const fiftyDayBefore = moment().subtract(50, 'days').startOf('day').toDate()
  await GameRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await GoldRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await RoomScoreRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await GameCardRecord.remove({time: {$lt: sevenDayBefore}}).exec()
  await CombatGain.remove({time: {$lt: sevenDayBefore}}).exec()
  await RoomRecord.remove({createAt: {$lt: fiftyDayBefore}}).exec()
  await GmNoteModel.remove({createAt: {$lt: sevenDayBefore}}).exec()
}

export default cleanRecord
