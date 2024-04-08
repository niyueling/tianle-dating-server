import * as schedule from 'node-schedule'
import * as mongoose from 'mongoose'
import * as config from './config'
import * as moment from 'moment'
import cleanRecord from './bin/cleanRecord'
import aggregateActivePlayer from './bin/aggregateActivePlayer'
import updateRoomCount from './bin/roomRecordLog'
import updateMnpAccessToken from "./bin/updateMnpAccessToken";
import {updateTurntableTimes, updateRobotGameState} from "./bin/updateMahjongSchedules";

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

// 0点更新用户参数
schedule.scheduleJob('0 0 * * *', function () {
  updateTurntableTimes()
    .catch(error => {
      console.error('update player params error', error.stack)
    })
})

// 每5分钟更新机器人对局状态
schedule.scheduleJob('*/3 * * * *', function () {
  updateRobotGameState()
    .catch(error => {
      console.error('update player robot game state', error.stack)
    })
})

