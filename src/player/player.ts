/**
 * Created by user on 2016-07-02.
 */
import * as Winston from 'winston';
import * as config from '../config';
import * as EventEmitter from 'events';
import * as ws from 'ws';
import {pick} from 'lodash'
import {serializeMessage, deserializeMessage} from '../network/utils';
import accountHandlers from './message-handlers/account';
import clubHandlers from './message-handlers/club';
import matchHandlers from './message-handlers/match';
import resourceHandlers from './message-handlers/resource';
import gameHandlers from './message-handlers/game';
import socialHandlers from './message-handlers/social';
import chatHandlers from './message-handlers/chat';
import mailHandlers from './message-handlers/mail';
import errorHandlers from './message-handlers/error';
import PlayerModel from '../database/models/player';
import {QueryApi} from "./message-handlers/query";
import {NewClub} from "./message-handlers/newClub";
import * as Parameter from 'parameter';
import {Errors, GameError} from "@fm/common/errors";
import {Region} from "./message-handlers/region";
import {service} from "../service/importService";
import {GoodsApi} from "./message-handlers/goodsApi";
import {AccountApi} from "./message-handlers/accountApi";
import {verifyWithRecord} from "../utils/jwt";
import {InviteApi} from "./message-handlers/inviteApi";
import {LotteryApi} from "./message-handlers/lotteryApi";
import {GameApi} from "./message-handlers/gameApi";
import {TurnTableApi} from "./message-handlers/turnTableApi";
import {LoginSignApi} from "./message-handlers/loginSignApi";
import {NewSignApi} from "./message-handlers/newSignApi";
import {NoticeApi} from "./message-handlers/noticeApi";
import {MockDataApi} from "./message-handlers/mockDataApi";
import {TaskApi} from "./message-handlers/taskApi";
import {GiftApi} from "./message-handlers/giftApi";
import {DebrisApi} from "./message-handlers/debrisApi";
import {VipApi} from "./message-handlers/vipApi";
import {RegressionApi} from "./message-handlers/regressionApi";
import {DailySupplementApi} from "./message-handlers/dailySupplementApi";
import {Channel, Connection} from 'amqplib'
import {IPlayerModel, ISocketPlayer} from "./ISocketPlayer";
import {GameTypes} from "../match/gameTypes";
import * as uuid from 'uuid'
import createClient from "../utils/redis"

const isTokenValid = async (apiName, token, player) => {
  if (!config.jwt.needNotToken.includes(apiName)) {
    if (!token) {
      // 没传 token
      return false;
    }
    const { isOk, data } = await verifyWithRecord(token);
    if (!isOk) {
      return false;
    }

    if(!player.model) {
      player.model = await PlayerModel.findOne({_id: data.playerId}).lean();
    }

    return data.playerId === player.model._id.toString();
  }
  // 不需要检查 token
  return true;
}

// 参数校验
const parameter = new Parameter({
  validateRoot: true, // restrict the being validate value must be a object
});

// 所有接口类
const apiClass = {
  query: QueryApi,
  club: NewClub,
  region: Region,
  goods: GoodsApi,
  account: AccountApi,
  invite: InviteApi,
  lottery: LotteryApi,
  game: GameApi,
  turnTable: TurnTableApi,
  mockData: MockDataApi,
  loginSign: LoginSignApi,
  notice: NoticeApi,
  newSign: NewSignApi,
  task: TaskApi,
  gift: GiftApi,
  debris: DebrisApi,
  vip: VipApi,
  regression: RegressionApi,
  dailySupplement: DailySupplementApi
}

// 调用api
function invokeApi(apiRoute, apiName, packet, player) {
  const methodName = apiClass[apiRoute].prototype.__apiMap.get(apiName);
  const rule = apiClass[apiRoute].prototype.__apiRule.get(apiName);
  // 实例化接口
  const cls = new apiClass[apiRoute](packet.name, player, service);
  // 调用函数
  if (cls[methodName]) {
    if (rule) {
      // 校验参数
      const errors = parameter.validate(rule, packet.message);
      if (errors) {
        return player.sendMessage(packet.name+'Reply', errors);
      }
    }
    return cls[methodName](packet.message).catch(e => {
      if (e instanceof GameError) {
        // 游戏内的消息
        return player.sendMessage(packet.name+'Reply', {ok: false, info: e.msg});
      } else {
        // 上报其它错误
        throw e;
      }
    });
  }
  return player.sendMessage('error', packet.name + '接口未实现')
}


const messageHandlers = {
  'test/echo': (player, message) => {
    player.sendMessage('test/echo', message);
  },
};

const transports = [new Winston.transports.Console()]
const logger = new Winston.Logger({transports})


const ipReg = /(\d+\.\d+\.\d+.\d+)/

const NullSocket = {
  close() {
    return;
  },
  terminate() {
    return;
  }
}

const rediClient = createClient()

Object.assign(messageHandlers,
    accountHandlers,
    clubHandlers,
    matchHandlers,
    resourceHandlers,
    gameHandlers,
    socialHandlers,
    chatHandlers,
    mailHandlers,
    errorHandlers,
);

export default class SocketPlayer extends EventEmitter implements ISocketPlayer {
  connection: Connection
  private isDone: boolean
  private readonly sendCallback: (err) => any
  private socket: any
  private channel: Channel
  private readonly debugMessage: boolean

  socketId: string
  location: string
  currentRoom: string
  clubId: number
  model: IPlayerModel
  gameName: GameTypes

  constructor(socket, connection) {
    super()
    this.isDone = false
    socket.player = this
    this.socket = socket
    this.connection = connection
    this.channel = null
    this.sendCallback = err => {
      if (err) {
        logger.warn(err)
      }
    }
    this.debugMessage = config.debug.message
    this.location = null
    this.socketId = uuid()
    logger.info('socket start ===>', this.socketId)
  }

  getDebugMessage(data) {
    let content = data
    if (content.length > 1024) {
      content = `${content.slice(0, 1024)}...`
    }

    return content
  }

  async getLocation(ip?) {
  if (!ip) {
  ip = this.getIpAddress();
}

// console.error("ip-%s", ip);

try {
  const res = await service.base.curl(`https://ips.market.alicloudapi.com/iplocaltion?ip=${ip}`, {
    method: "get",
    headers: {
      Authorization: "APPCODE " + config.ipConfig.appCode
    }
  });

  // console.warn("response-%s", JSON.stringify(res));

  if (res.status === 200) {
    return JSON.parse(res.data);
  }

  return {code: 200, result: {}};
} catch (e) {
  return {code: 200, result: {}};
}

}

getIpAddress() {

  if (!this.socket || !this.socket.remoteAddress) {
    return 'ip获取中'
  }
  const fullAddress = this.socket.remoteAddress || '0.0.0.0'
  const matches = fullAddress.match(ipReg)
  if (matches) {
    return matches[1]
  } else {
    logger.error('the wrong ip is ', fullAddress)
    return 'ip获取中'
  }
}

onMessage(data) {
  try {
    console.log(`Player: [${this._id}, ${this.name}] receive ${this.getDebugMessage(data)}`)
    const packet = deserializeMessage(data)
    const handler = messageHandlers[packet.name]
    if (handler) {
      return handler(this, packet.message)
    }
    // 调用新接口函数
    const req = packet.name.split('/');
    if (req.length === 2 && apiClass[req[0]]) {
      return invokeApi(req[0], req[1], packet, this);
    }
    this.requestToCurrentRoom(packet.name, packet.message)
    logger.error(`未知消息:${JSON.stringify(packet)}`)
  } catch (e) {
    logger.error(e)
  }

  return false
}

get _id() {
  return this.model && this.model._id
}

get name() {
  return this.model && this.model.name
}

get gold() {
  return (this.model && this.model.gold) || 0
}

addGold(v) {
  if (this.model) {
    let g = this.model.gold
    g += v
    this.model.gold = g
    this.sendMessage('resources/updateGold', {gold: g})
    PlayerModel.update({_id: this.model._id}, {$set: {gold: g}}, err => {
      if (err) {
        logger.error(err)
      }
    })
  }
}

onDisconnect() {
  this.emit('disconnect', {from: this._id})

  this.socket.player = null
  this.socket = NullSocket
  if (this.channel) {
    this.channel.publish('userCenter', `user.${this._id}`, new Buffer(
      JSON.stringify({type: 'cmd', cmd: 'leave', sid: "close"})))
  }
  // this.channel && this.channel.publish('userCenter', `user.${this._id}`, new Buffer(
  //   JSON.stringify({type: 'cmd', cmd: 'leave', sid: "close"})))

  this.disconnect()
    .catch(error => {
      logger.error('onDisconnect', `Player [${this._id} with error`, error.stack)
    })
    .then(() => {
      logger.info(`Player [${this._id}, ${this.name}] disconnected`)
    })
}

async disconnect() {
  this.isDone = true
  logger.info(`Disconnect player: ${this._id}`, this.socketId)

  if (this.socket) {
    const promise = new Promise(resolve => {
      this.once('disconnect', () => resolve())
    })

    rediClient.decrAsync(`gameCounter.${this.gameName}`)
      .then()
    this.socket.close()
    this.socket.terminate()
    await promise
  }
}

sendMessage(name, message) {
  try {
    const packet = {name, message}
    const data = serializeMessage(packet)
    // if (this.debugMessage) {
    //   logger.debug(`Player: [${this._id}, ${this.name}] send ${this.getDebugMessage(data)}`)
    // }
    console.log(`Player: [${this._id}, ${this.name}] send ${data}`)
    if (this.socket && this.socket.readyState === ws.OPEN) {
      this.socket.send(data, this.sendCallback)
    }
  } catch (e) {
    logger.error(e)
  }
}

// 返回成功
replySuccess(name, data?: any) {
  return this.sendMessage(name + 'Reply', { ok: true, data: data || {} })
}

// 返回失败
replyFail(name, info: string, noReply?: boolean) {
  if (!noReply) {
    return this.sendMessage(name + 'Reply', { ok: false, info: info })
  }
  // 不加 reply
  return this.sendMessage(name, { ok: false, info: info })
}

getGameMsgHandler() {
  return gameHandlers
}

isRobot() {
  return false
}

get myQueue() {
  return this.socketId
}

async connectToBackend() {
  if (!this.connection) {
    logger.error("connectToBackend failed:connecttiong is null!")
    return
  }

  this.channel = await this.connection.createChannel()
  this.channel.on('error', error => {
    logger.error('connectToBackend channel error ', this.socketId, error)
    try {
      this.socket.close()
      this.socket.terminate()
    } catch (closingSocketError) {
      logger.error('terminating socket error', this.socketId, closingSocketError)
    }
  })

  await this.channel.assertExchange('userCenter', 'topic', {durable: false})
  await this.channel.assertQueue(this.myQueue, {exclusive: true, durable: false, autoDelete: true})

  try {
    await this.channel.bindQueue(this.myQueue, 'userCenter', `user.${this._id}`)
    const {consumerTag} = await this.channel.consume(this.myQueue, async message => {
      if (!message) return

      try {
        const messageBody = JSON.parse(message.content.toString())

        console.log(`from dating [${this._id}`, messageBody.name || messageBody.cmd)

        if (messageBody.type === 'cmd' && messageBody.cmd === 'leave' && this.socketId !== messageBody.sid) {
          this.socket.close()
          this.socket.terminate()
          await this.channel.cancel(consumerTag)
          return this.channel.close()
        }

        if (messageBody.name === 'room/join-success') {
          this.currentRoom = messageBody.payload._id
          this.cancelListenClub(this.clubId)
        }

        if (messageBody.name === 'newClubRoomCreated') {
          this.sendMessage('club/updateClubInfo', messageBody.payload)
          return;
        }

        if (messageBody.name === 'clubRequest') {
          this.sendMessage('club/haveRequest', {})
          return;
        }

        if (messageBody.name === 'resources/updateGold') {
          this.updateGoldGemRuby({gold: messageBody.payload.gold})
        }
        if (messageBody.name === 'resource/createRoomUsedGem') {
          this.updateGoldGemRuby({gem: -messageBody.payload.createRoomNeed})
        }

        this.sendMessage(messageBody.name, messageBody.payload)
      } catch (err) {
        logger.error('backMessageFromBackend', err, message.content.toString())
      }
    }, {noAck: true})

    // this.channel.publish('userCenter', `user.${this._id}`, new Buffer(
    //   JSON.stringify({type: 'cmd', cmd: 'leave', sid: this.socketId})))

  } catch (e) {
    logger.error('consume error', this.socketId, e)
  }
}

async listenClub(clubId = -1) {
    console.warn("channel-%s", JSON.stringify(this.channel));
  if (this.channel && clubId) {
    await this.channel.assertExchange(`exClubCenter`, 'topic', {durable: false})
    await this.channel.bindQueue(this.myQueue, `exClubCenter`, `club:${clubId}`)
    this.clubId = clubId;
  }
}

async cancelListenClub(clubId = -1) {
  if (this.channel && clubId) {
    await this.channel.unbindQueue(this.myQueue, `exClubCenter`, `club:${this.gameName}:${clubId}`)
  }
}

updateGoldGemRuby(data) {
  if (this.model) {
    this.model.gold += data.gold || 0
    this.model.gem += data.gem || 0
    this.model.ruby += data.ruby || 0
  }
}

requestTo(queue, name, message) {
  const playerIp = this.getIpAddress()
  this.channel.sendToQueue(
    queue,
    this.toBuffer({name, from: this._id, payload: message, ip: playerIp}),
    {replyTo: this.myQueue})
}

requestToCurrentRoom(name, message = {}) {
  const playerIp = this.getIpAddress()
  if (!this.currentRoom) {
    logger.error('player is not in room', name, message)
    return
  }

  try {
    this.channel.publish(
      'exGameCenter',
      `${this.gameName}.${this.currentRoom}`,
      this.toBuffer({name, from: this._id, payload: message, ip: playerIp}),
      {replyTo: this.myQueue})
  } catch (e) {
    logger.error('publish error', e)
  }
}

// 前端强制解散
// forceCloseRoom(gameName, roomNum){
//   this.channel.publish(
//     'exGameCenter',
//     `${gameName}.${roomNum}`,
//     this.toBuffer({name:'forceDissolve'}),
//     {replyTo: this.myQueue})
// }

setGameName(gameType) {
  this.gameName = gameType || 'paodekuai';
}

requestToRoom(roomId, name, message) {
  const playerIp = this.getIpAddress()
  this.channel.publish(
    'exGameCenter',
    `${this.gameName}.${roomId}`,
    this.toBuffer({name, from: this._id, payload: message, ip: playerIp}),
    {replyTo: this.myQueue})
}

emit(event: string, message): boolean {
  super.emit(event, message)
  this.requestToCurrentRoom(event, message)
  return true
}

toBuffer(messageJson) {
  return new Buffer(JSON.stringify(messageJson))
}

toJSON() {
  return this.model._id
}

updateResource2Client() {
  this.sendMessage('resource/update', pick(this.model, ['gold', 'gem', 'ruby']))
}
}
