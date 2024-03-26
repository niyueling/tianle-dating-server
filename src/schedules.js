import * as schedule from 'node-schedule'
import * as mongoose from 'mongoose'
import * as config from './config'
import * as moment from 'moment'
import cleanRecord from './bin/cleanRecord'
import fillPoorModel from './bin/fillUpRuby'
import aggregateExtRecord from './bin/aggregateExtRecord'
import aggregateActivePlayer from './bin/aggregateActivePlayer'
import updateRoomCount from './bin/roomRecordLog'
import saveClubRoomInfo from './bin/clubRoomRecordLog'
import cleanUselessClub from "./bin/cleanUselessClub";
import {service} from "./service/importService";
import updateMnpAccessToken from "./bin/updateMnpAccessToken";
import {updateTurntableTimes} from "./bin/updateMahjongSchedules";

mongoose.connect(config.database.url)

schedule.scheduleJob('0 4 * * *', function () {
  console.log(`cleanRecord `, new Date());
  cleanRecord()
    .catch(error => {
      console.log('cleanRecord ', error.stack)
    })
})

schedule.scheduleJob('0 */3 * * *', function () {
  console.log(`aggregateAllActivePlayer`, new Date());
  aggregateActivePlayer(new Date())
    .catch(error => {
      console.log('aggregateExtRecord error', error.stack)
    })
})

schedule.scheduleJob('10 0 * * *', function () {
  console.log(`Room Record Log`, new Date());
  const from = moment().subtract(1, 'day').startOf('day').toDate()
  updateRoomCount(from.toISOString())
    .catch(error => {
      console.log('Room Record Log', error.stack)
    })
})

// 每15分钟更新accessToken
schedule.scheduleJob('*/15 * * * *', function () {
  updateMnpAccessToken()
    .catch(error => {
      console.error('update mnp accerss token error', error.stack)
    })
})

// 0点更新更新抽奖次数
schedule.scheduleJob('0 0 * * *', function () {
  updateTurntableTimes()
    .catch(error => {
      console.error('update player turntabletimes error', error.stack)
    })
})

