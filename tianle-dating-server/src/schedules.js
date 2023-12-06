import * as schedule from 'node-schedule'
import * as mongoose from 'mongoose'
import * as config from './config'
import * as moment from 'moment'
import updateRank from './bin/updateRankList'
import cleanRecord from './bin/cleanRecord'
import fillPoorModel from './bin/fillUpRuby'
import aggregateExtRecord from './bin/aggregateExtRecord'
import aggregateActivePlayer from './bin/aggregateActivePlayer'
import updateRoomCount from './bin/roomRecordLog'
import saveClubRoomInfo from './bin/clubRoomRecordLog'
import cleanUselessClub from "./bin/cleanUselessClub";
import {service} from "./service/importService";
import updateInvite from "./bin/updateInvite";
import {
  updateBlockRobotCurLevelRanking,
  updateBlockTurntableTimes,
  updateBlockUserPower
} from "./bin/updateBlockSchedules";

mongoose.connect(config.database.url)

schedule.scheduleJob('0 0 * * 1', function () {
  console.log(`update Rank`, new Date());
  updateRank()
    .catch(error => {
      console.log('update Rank', error.stack)
    })
})

schedule.scheduleJob('0 4 * * *', function () {
  console.log(`cleanRecord `, new Date());
  cleanRecord()
    .catch(error => {
      console.log('cleanRecord ', error.stack)
    })
})

schedule.scheduleJob('0 6 * * *', function () {
  console.log(`give out poor model ruby`, new Date());
  fillPoorModel()
    .catch(error => {
      console.log('give out poor model ruby', error.stack)
    })
})

schedule.scheduleJob('59 * * * *', function () {
  console.log(`aggregateExtRecord`, new Date());
  aggregateExtRecord(new Date())
    .catch(error => {
      console.log('aggregateExtRecord error', error.stack)
    })


  var curDate = new Date();
  if (curDate.getHours() < 2) {
    curDate = moment().subtract(1, "day").toDate();
    aggregateExtRecord(curDate)
      .catch(error => {
        console.log('aggregateExtRecord error', error.stack)
      })
  }

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

schedule.scheduleJob('10 0 * * *', function () {
  console.log(`club Room Record Log`, new Date());
  const from = moment().subtract(1, 'day').startOf('day').toDate()
  saveClubRoomInfo(from.toISOString())
    .catch(error => {
      console.log('club Room Record Log', error.stack)
    })
})

// 定时删除俱乐部, 每天晚上 2 点执行
schedule.scheduleJob('0 2 * * *', function () {
  console.log(`clean club`, new Date());
  cleanUselessClub()
    .catch(error => {
    console.log('cleanRecord ', error.stack)
  })
})

// // 每天晚上 0 点检查开启排行榜
// schedule.scheduleJob('1 0 * * *', function () {
//   console.log(`open rank`, new Date());
//   service.invite.initRank()
//     .catch(error => {
//       console.log('open rank error ', error.stack)
//     })
// })

// 中午 12 点开始结算
schedule.scheduleJob('0 12 * * *', function () {
  console.log('settle rank 结算排行榜', new Date());
  service.invite.settleRankPrize()
    .catch(error => {
      console.error('open rank error', error.stack)
    })
})

// 每分钟更新邀请数据
schedule.scheduleJob('*/1 * * * *', function () {
  updateInvite()
    .catch(error => {
      console.error('update invite profit error', error.stack)
    })
})


// 0点更新方块战争抽奖次数
schedule.scheduleJob('0 0 * * *', function () {
  updateBlockTurntableTimes()
    .catch(error => {
      console.error('update block turntable times error', error.stack)
    })
})

// 每分钟更新方块战争体力
schedule.scheduleJob('*/1 * * * *', function () {
  updateBlockUserPower()
    .catch(error => {
      console.error('update block user power error', error.stack)
    })
})

// 0点更新方块战争机器人排行榜
schedule.scheduleJob('0 0 * * *', function () {
  updateBlockRobotCurLevelRanking()
    .catch(error => {
      console.error('update block robot curLevel error', error.stack)
    })
})

