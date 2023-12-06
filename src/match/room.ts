/**
 * Created by user on 2016-07-04.
 */
import * as logger from 'winston'
import * as EventEmitter from 'events'
import * as mongoose from 'mongoose'
import * as ms from 'ms'
import { consumeLogType } from '@fm/common/constants';
import DiamondRecord from "../database/models/diamondRecord";
import Game from './game'
import NpcPlayer from '../player/npc_player'
import '../utils/algorithm'
import PlayerManager from '../player/player-manager'
import PlayerModel from '../database/models/player'
import GameRecord from '../database/models/gameRecord'
import RoomRecord from '../database/models/roomRecord'
import ConsumeRecord from '../database/models/consumeRecord'
import lobby from './lobby'
import {values, remove, pick} from 'lodash'
import Rule from './mj_hunan/Rule'
import {eqlModelId} from "./modelId"
import TableState from "./mj_hunan/table_state"
import createRedisClient from "../utils/redis"

const redisClient = createRedisClient()
const ObjectId = mongoose.Types.ObjectId

class Room extends EventEmitter {

  dissolveTimeout: NodeJS.Timer;
  dissolveTime: number

  game: Game
  capacity: number
  players: Array<any>
  isPublic: boolean
  snapshot: Array<any>
  disconnectCallback: (any) => void
  readyPlayers: Array<string>
  playersOrder: any[]
  glodPerFan: number
  charged: boolean
  charge: () => void
  gameState: TableState
  scoreMap: any
  disconnected: Array<any>
  initBase: number
  zhuangCounter: number
  counterMap: any
  playerGainRecord: any
  ownerId: string
  creator: any
  currentBase: number
  lunZhuangCount: number

  _id: string
  uid: string

  dissolveReqInfo: { name: string, _id: string, type: string }[] = []
  waitNextGamePlayers: Array<any> = []


  static publicRoomLowestLimit(rule) {
    if (rule.diFen >= 500) {
      return rule.diFen * 100 / 2 - 1
    }
    return 0
  }

  constructor(rule: any) {
    super()
    this.game = new Game(rule)
    this.capacity = rule.playerCount || 4
    this.players = new Array(this.capacity).fill(null)
    this.playersOrder = new Array(this.capacity).fill(null)
    this.snapshot = []
    this.isPublic = rule.isPublic
    this.disconnectCallback = (player) => {
      this.playerDisconnect(player)
    }

    this.readyPlayers = []
    this.gameState = null
    this.scoreMap = {}
    this.disconnected = []
    this.counterMap = {}
    this.charged = false

    this.charge = rule.share ? this.chargeAllPlayers.bind(this) : this.chargeCreator.bind(this)

    this.glodPerFan = rule.difen || 1
    this.initBase = this.currentBase = rule.base || 1
    this.zhuangCounter = 1

    this.lunZhuangCount = this.rule.quan * this.rule.playerCount
    this.playerGainRecord = {}

    this.uid = ObjectId().toString()

    this.dissolveReqInfo = []

  }

  get base() {
    return this.glodPerFan * this.currentBase
  }

  recordPlayerEvent(evtType, playerId) {
    if (this.counterMap[evtType] == null) {
      this.counterMap[evtType] = []
    }
    this.counterMap[evtType].push(playerId)
  }

  initScore(player) {


    if (this.scoreMap[player._id] === undefined) {
      this.scoreMap[player._id] = this.game.rule.initScore
    }
  }


  clearScore(playerId) {
    if (!this.isPublic) {
      delete this.scoreMap[playerId]
    }
  }

  canJoin(player) {
    if (!player) {
      return false
    }

    if (player.room) {
      return false
    }

    return this.players.filter(x => x != null).length + this.disconnected.length < this.capacity
  }

  mergeOrder() {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i]) {
        this.playersOrder[i] = this.players[i]
      }
    }
  }


  arrangePos(player, reconnect?) {
    if (reconnect) {

      let indexForPlayer = this.indexOf(player)

      if (indexForPlayer < 0) {
        this.arrangePos(player)
      }

      this.players[indexForPlayer] = player
      return
    }
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null && this.playersOrder[i] == null) {
        this.players[i] = player
        break
      }
    }
  }

  removePlayer(player) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] === player) {
        this.players[i] = null
        break
      }
    }
  }

  isEmpty() {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] != null) {
        return false
      }
    }
    return true
  }

  getScore(player) {
    return this.scoreMap[player._id]
  }

  recordGameScore(table, states) {
    let {players} = table

    states.forEach(state => {
      const id = state.model._id
      const score = state.score

      if (this.playerGainRecord[id]) {
        this.playerGainRecord[id] += score
      }
      else {
        this.playerGainRecord[id] = score
      }
    })

    const playerArray = states.map(state => {
      return {
        name: state.model.name,
        score: state.score,
      }
    })

    const winnerStates = states.filter((x) => x.score > 0)
    let winner = null
    if (winnerStates.length > 0) {
      winner = winnerStates[0].model._id
    }

    GameRecord.create({
      room: this.uid,
      players: players.map(p => p.model._id),
      playersInfo: players.map(player => ({model: pick(player.model, ['name', 'headImgUrl', 'sex', 'gold', 'shortId'])})),
      record: playerArray,
      game: {
        base: this.currentBase, caiShen: table.caishen, roomId: this._id,
        ro: this.rule.ro, niaos: table.niaos
      },
      winner,
      states,
      events: table.recorder.getEvents()
    }, err => {
      if (err) {
        logger.error(err)
      }
    })
  }

  async recordRoomScore(): Promise<any> {

    const players = Object.keys(this.playerGainRecord)
    const scores = this.playersOrder.map(player => ({
      score: this.playerGainRecord[player.model._id] || 0,
      name: player.model.name,
      headImgUrl: player.model.headImgUrl,
      shortId: player.model.shortId
    }))

    let roomRecord = {
      players, scores,
      roomNum: this._id, room: this.uid,
      createAt: Date.now(),
    }

    RoomRecord
      .update({room: this.uid}, roomRecord, {upsert: true, setDefaultsOnInsert: true})
      .catch(e => {
        logger.error('recordRoomScore error', e)
      })

    return roomRecord
  }

  addScore(playerId: string, gains: number) {
    const p = PlayerManager.getInstance().getPlayer(playerId)
    this.scoreMap[playerId] += gains

    if (gains > 0) {
      if (p) {
        p.addGold(gains)
      } else {
        PlayerModel.update({_id: playerId}, {$inc: {gold: gains}},
          (err) => {
            if (err) {
              logger.error(err)
            } else {

            }
          })
      }
    }
  }

  removeDisconnected(item) {
    for (let i = 0; i < this.disconnected.length; i++) {
      if (this.disconnected[i] === item) {
        this.disconnected.splice(i, 1)
      }
    }
  }

  reconnect(reconnectPlayer) {
    const disconnectedItem = this.disconnected.find(x => eqlModelId(x[0], reconnectPlayer._id))
    if (disconnectedItem) {
      reconnectPlayer.room = this
      this.arrangePos(reconnectPlayer, true)
      this.mergeOrder()

      reconnectPlayer.on('disconnect', this.disconnectCallback)
      this.removeDisconnected(disconnectedItem)

      if (!this.gameState) {

        this.announcePlayerJoin(reconnectPlayer)
      }
      // Fixme the index may be wrong
      this.emit('reconnect', reconnectPlayer, this.readyPlayers.indexOf(reconnectPlayer._id))
      this.broadcastRejoin(reconnectPlayer)
      if (this.dissolveTimeout) {
        this.updateReconnectPlayerDissolveInfoAndBroadcast(reconnectPlayer);
      }
      return true
    }
    return false
  }

  broadcastRejoin(reconnectPlayer) {
    this.broadcast('room/rejoin', this.joinMessageFor(reconnectPlayer))
  }

  get inRoomPlayers() {
    return this.players.filter(p => p !== null)
  }


  joinMessageFor(newJoinPlayer): any {
    return {
      index: this.indexOf(newJoinPlayer),
      model: newJoinPlayer.model,
      ip: newJoinPlayer.getIpAddress(),
      location: newJoinPlayer.location,
      owner: this.ownerId,
      score: this.getScore(newJoinPlayer),
      base: this.currentBase,
      zhuangCounter: this.zhuangCounter,
      juIndex: this.game.juIndex,
      readyPlayers: this.readyPlayers.map(playerId => {
        const readyPlayer = this.inRoomPlayers.find((p) => p._id == playerId)
        return this.players.indexOf(readyPlayer)
      }),
      disconnectedPlayers: this.disconnected.map(item => this.indexOf({_id: item[0]})),
      maiDi: this.rule.maiDi
    }
  }

  announcePlayerJoin(newJoinPlayer) {
    this.broadcast('room/join', this.joinMessageFor(newJoinPlayer))
    this.players
      .map((p, index) => {
        return p || this.playersOrder[index]
      })
      .filter((x) => x !== null && x.model._id !== newJoinPlayer.model._id)
      .forEach(
        alreadyInRoomPlayer =>
          newJoinPlayer.sendMessage('room/join', this.joinMessageFor(alreadyInRoomPlayer))
      )
  }

  indexOf(player) {
    return this.playersOrder.findIndex(playerOrder => playerOrder && playerOrder._id == player._id)
  }

  join(newJoinPlayer) {

    // fixme  bug not like push
    if (this.disconnected.find(x => x[0] === newJoinPlayer._id)) {
      return false
    }
    if (!this.canJoin(newJoinPlayer)) {
      return false
    }
    newJoinPlayer.room = this
    newJoinPlayer.on('disconnect', this.disconnectCallback)
    this.arrangePos(newJoinPlayer, false)

    this.mergeOrder()

    this.initScore(newJoinPlayer)

    this.emit('join')
    this.announcePlayerJoin(newJoinPlayer)

    this.pushToSnapshot(newJoinPlayer)
    return true
  }


  lowestMultiplier() {

  }


  lowestLimit(): number {
    if (this.rule.diFen === 500) {
      return 50000
    }
    return 0
  }

  difen() {
    return this.game.rule.ro.difen
  }

  isInRoom(p) {
    return this.players.find(player => player === p)
  }


  nextGame(thePlayer) {
    if (this.game.juShu <= 0) {
      thePlayer.sendMessage('room/join-fail', {reason: '牌局已经结束.'})
      return
    }

    if (!this.isInRoom(thePlayer)) {
      thePlayer.sendMessage('room/join-fail', {reason: '你已经不属于这个房间.'})
      return false
    }

    this.announcePlayerJoin(thePlayer)

    return true
  }


  canDissolve() {
    if (this.dissolveReqInfo.length === 0) {
      return false
    }

    const onLinePlayer = this.dissolveReqInfo
      .filter((reqInfo) => {
        const id = reqInfo._id
        return !this.disconnected.some((item) => item[0] === id)
      })
    const agreeReqs = onLinePlayer.filter(reqInfo => reqInfo.type === 'agree'
      || reqInfo.type === 'originator' || reqInfo.type === 'agree_offline')

    if (onLinePlayer.length <= 2) {
      if (agreeReqs.length === 2) {
        return true;
      }
      return false;
    }

    return agreeReqs.length > 0 && agreeReqs.length + 1 >= onLinePlayer.length

  }

  dissolve(roomCreator) {
    if (roomCreator._id !== this.ownerId) {
      roomCreator.sendMessage('room/dissolveReply', {errorCode: 1})
      return false
    }
    if (this.gameState !== null) {
      // player.sendMessage('room/dissolveReply', {errorCode: 2});
      //return false;
      this.gameState.dissolve()
    }
    // this.recordScore()
    roomCreator.sendMessage('room/dissolveReply', {errorCode: 0})
    roomCreator.room = null
    this.players.forEach(player => {
      if (player && player !== roomCreator) {
        player.sendMessage('room/dissolve', {})
        player.room = null
      }
    })
    this.emit('empty', this.disconnected.map(x => x[0]))
    this.players.fill(null)
    return true
  }

  forceDissolve() {
    this.dissolveReqInfo = [];
    const allOverMessage = this.allOverMessage()

    clearTimeout(this.dissolveTimeout)
    this.dissolveTimeout = null

    this.players
      .filter(p => p)
      .forEach(player => {
        player.sendMessage('room/dissolve', allOverMessage)
        player.room = null
      })
    this.players.fill(null)
    this.emit('empty', this.disconnected.map(x => x[0]))
    return true
  }


  playerDisconnect(player) {//问题
    const p = player
    const index = this.players.indexOf(player)
    if (index === -1) {
      return true
    }
    if (this.isPublic) {
      if (!this.gameState) {
        this.leave(player)
        return true
      }
    }
    p.room = null
    if (!this.gameState) {
      this.removeReadyPlayer(p._id)
    }

    if (this.dissolveTimeout) {
      this.updateDisconnectPlayerDissolveInfoAndBroadcast(player);
    }

    this.broadcast('room/playerDisconnect', {index: this.players.indexOf(player)}, player.msgDispatcher)
    this.removePlayer(player)
    this.disconnected.push([player._id, index])
    this.emit('disconnect', p._id)
    return true
  }

  removeReadyPlayer(playerId: string) {
    let index = this.readyPlayers.indexOf(playerId)
    if (index >= 0) {
      this.readyPlayers.splice(index, 1)
      return true
    }
    return false
  }

  leave(player) {
    if (this.gameState) {
      return false
    }
    const p = player
    if (p.room !== this) {
      return false
    }
    p.removeListener('disconnect', this.disconnectCallback)
    this.emit('leave')
    this.removePlayer(player)

    for (let i = 0; i < this.playersOrder.length; i++) {
      let po = this.playersOrder[i]
      if (po && po.model._id == player.model._id) {
        this.playersOrder[i] = null
      }
    }

    p.room = null
    if (this.players.every(x => (x == null || x.isRobot()))) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i] = null
      }
    }
    this.broadcast('room/leave', {_id: p._id})
    this.removeReadyPlayer(p._id)
    this.clearScore(player._id)

    return true
  }

  isReadyPlayer(playerId) {
    for (let readyPlayerId of this.readyPlayers) {
      if (readyPlayerId === playerId) {
        return true
      }
    }
    return false
  }


  ready(player) {
    if (this.gameState) {
      return
    }
    if (!this.isReadyPlayer(player._id)) {
      this.readyPlayers.push(player._id)
      this.broadcast('room/playerReady', {index: this.players.indexOf(player)})
    }

    if (this.readyPlayers.length === this.capacity) {
      this.players.forEach(x => {
        x.sendMessage('room/startGame', {})
      })
      this.readyPlayers = this.players.map(x => x._id)
      this.playersOrder = this.players.slice()
      this.snapshot = this.players.slice()
      const gameState = this.game.startGame(this)
      this.gameState = gameState
      gameState.fapai()
    }
  }

  unReady(player) {
    if (this.gameState) {
      return false
    }
    if (!this.isReadyPlayer(player._id)) {
      return false
    }
    this.removeReadyPlayer(player._id)
    return true
  }

  getPlayers() {
    return this.players
  }

  broadcast(name, message, except?) {
    for (let i = 0; i < this.players.length; ++i) {
      const player = this.players[i]
      if (player && player !== except) {
        player.sendMessage(name, message)
      }
    }
  }

  isFull(player) {
    if (this.players.filter(x => x != null).length >= this.capacity) {
      return true
    }
    if (this.readyPlayers.length >= this.capacity) {
      return !(player && this.isReadyPlayer(player._id))
    }
    return false
  }


  onRequestDissolve(player) {
    const dissolveInfo = this.getDissolvePlayerInfo(player);
    this.broadcast('room/dissolveReq', {dissolveReqInfo: dissolveInfo, startTime: this.dissolveTime});
    if (this.canDissolve()) {
      this.forceDissolve()
      return
    }

    if (!this.dissolveTimeout) {
      this.dissolveTimeout = setTimeout(() => {
        this.forceDissolve()
      }, 180 * 1000)
    }

    return true;
  }

  onAgreeDissolve(player) {
    const item = this.dissolveReqInfo.find((x) => {
      return x.name === player.model.name;
    });
    if (item) {
      item.type = 'agree';
    }
    this.broadcast('room/dissolveReq', {dissolveReqInfo: this.dissolveReqInfo});

    if (this.canDissolve()) {
      this.forceDissolve()
      return
    }
    return true;
  }

  onDisAgreeDissolve(player) {
    const item = this.dissolveReqInfo.find((x) => {
      return x.name === player.model.name;
    });
    if (item) {
      item.type = 'disAgree';
      clearTimeout(this.dissolveTimeout)
      this.dissolveTimeout = null
    }
    this.broadcast('room/dissolveReq', {dissolveReqInfo: this.dissolveReqInfo});
    return true;
  }

  getDissolvePlayerInfo(player) {
    this.dissolveReqInfo = [];
    this.dissolveTime = new Date().getTime();
    this.dissolveReqInfo.push({
      type: 'originator',
      name: player.model.name,
      _id: player.model._id
    });
    for (let i = 0; i < this.players.length; i++) {
      const pp = this.players[i];
      if (pp && pp.isRobot()) {
        this.dissolveReqInfo.push({
          type: 'agree',
          name: pp.model.name,
          _id: pp.model._id
        });
      } else if (pp && pp !== player) {
        this.dissolveReqInfo.push({
          type: 'waitConfirm',
          name: pp.model.name,
          _id: pp.model._id
        });
      }
    }
    for (let i = 0; i < this.disconnected.length; i++) {
      const pp = this.disconnected[i];
      this.snapshot.forEach(player => {
          if (pp && player.model._id === pp[0]) {
            this.dissolveReqInfo.push({
              type: 'offline',
              name: player.model.name,
              _id: player.model._id
            });
          }
        }
      )
    }
    return this.dissolveReqInfo;
  }

  recDissolvePlayerInfo(player) {
    const item = this.dissolveReqInfo.find((x) => {
      return x.name === player.model.name;
    });
    if (item) {
      if (item.type === 'agree_offline') {
        item.type = 'agree';
      } else if (item.type !== 'originator') {
        item.type = 'waitConfirm';
      }
    }
    this.broadcast('room/dissolveReq', {dissolveReqInfo: this.dissolveReqInfo, startTime: this.dissolveTime}, player);
  }

  updateReconnectPlayerDissolveInfoAndBroadcast(reconnectPlayer) {
    const item = this.dissolveReqInfo.find((x) => {
      return x.name === reconnectPlayer.model.name
    })
    if (item) {
      if (item.type === 'agree_offline') {
        item.type = 'agree'
      } else if (item.type !== 'originator') {
        item.type = 'waitConfirm'
      }
    }
    this.broadcast('room/dissolveReq',
      {dissolveReqInfo: this.dissolveReqInfo, startTime: this.dissolveTime})
  }

  updateDisconnectPlayerDissolveInfoAndBroadcast(player) {
    const item = this.dissolveReqInfo.find((x) => {
      return x.name === player.model.name
    })
    if (item) {
      if (item.type === 'agree') {
        item.type = 'agree_offline'
      } else if (item.type !== 'originator') {
        item.type = 'offline'
      }
    }
    this.broadcast('room/dissolveReq', {dissolveReqInfo: this.dissolveReqInfo, startTime: this.dissolveTime})
  }


  changeZhuang() {
    this.lunZhuangCount -= 1
  }

  allOver(): boolean {
    return this.game.juShu <= 0
  }

  someoneOverLostLimit() {
    return values(this.scoreMap).some(score => score <= this.rule.lostLimit)
  }

  gameOver(nextZhuangId, states) {
    const nextZhuang = this.players.find(x => x != null && x._id === nextZhuangId)
    if (nextZhuang === this.players[0]) {

      const zhuangState = states.filter((state) => state.model._id === nextZhuangId)[0]

      if (zhuangState.events.hu && zhuangState.events.hu.length > 0) {
        this.zhuangCounter += 1
        this.currentBase += 1
      }
    } else {
      this.currentBase = this.initBase
      this.zhuangCounter = 1
      this.changeZhuang()
    }
    this.sortPlayer(nextZhuang)
    this.readyPlayers = []
    this.gameState.dissolve()
    this.gameState = null

    if (this.allOver()) {
      const message = this.allOverMessage()

      this.broadcast('room/allOver', message)
      this.players.forEach(x => x && this.leave(x))
      this.emit('empty', this.disconnected)
    } else {
      this.players.forEach(x => {
        if (x && x.isRobot()) {
          if (this.nextGame(x)) {
            setTimeout(() => {
              this.leave(x)
            }, ms('5s'))
          } else {
            setTimeout(() => {
              this.leave(x)
            }, ms('5s'))
          }
        }
      })
    }
  }


  clearDisconnected() {
    this.disconnected.forEach(arr => {
      let disConnectedPlayer = arr[0]
      lobby.getInstance().clearDisConnectedPlayer(disConnectedPlayer)
    })
    this.disconnected = []
  }


  allOverMessage(): any {

    const message = {players: {}, roomNum: this._id}
    this.snapshot
      .filter(p => p)
      .forEach(player => {
        message.players[player.model._id] = {
          userName: player.model.name,
          headImgUrl: player.model.headImgUrl
        }
      })
    Object.keys(this.counterMap).forEach(x => {
      this.counterMap[x].forEach(p => {
        message.players[p][x] = (message.players[p][x] || 0) + 1
      })
    })
    Object.keys(this.scoreMap).forEach(playerId => {
      message.players[playerId] && (message.players[playerId].score = this.playerGainRecord[playerId])
    })

    const creator = message.players[this.creator.model._id]
    if (creator) {
      creator['isCreator'] = true
    }

    return message
  }

  privateRoomFee() {
    if (this.rule.juShu === 4) {
      return 1
    } else if (this.rule.juShu === 8) {
      return 2
    } else {
      return 3
    }
  }

  chargeCreator() {
    if (!this.charged) {
      this.charged = true
      const createRoomNeed = this.privateRoomFee()
      const creatorId = this.creator.model._id
      const playerManager = PlayerManager.getInstance()

      const payee = playerManager.getPlayer(creatorId) || this.creator

      payee.model.gem -= createRoomNeed
      payee.sendMessage('resource/createRoomUsedGem', {
        createRoomNeed,
      })

      PlayerModel.update({_id: creatorId},
        {
          $inc: {
            gem: -createRoomNeed,
          },
        },
        (err) => {
          if (err) {
            logger.error(err)
          }
        })
      new ConsumeRecord({player: creatorId, gem: createRoomNeed}).save()
    }
  }

  chargeAllPlayers() {
    if (!this.charged) {
      this.charged = true
      const createRoomNeed = this.privateRoomFee()
      const playerManager = PlayerManager.getInstance()

      const share = Math.ceil(createRoomNeed / this.capacity)
      for (let player of this.snapshot) {

        const payee = playerManager.getPlayer(player.model._id) || player

        payee.model.gem -= share
        payee.sendMessage('resource/createRoomUsedGem', {
          createRoomNeed: share
        })
        PlayerModel.update({_id: player.model._id},
          {
            $inc: {
              gem: -share,
            },
          },
          (err) => {
            if (err) {
              logger.error(player.model, err)
            }
          })

        new ConsumeRecord({player: player.model._id, share}).save()
      }
    }
  }

  startWithRobot(player) {
    if (this.gameState) {
      player.sendMessage('room/startWithRobotReply', {errorCode: 1})
      return
    }
    const readyCount = this.players.filter(x => x != null).length
    if (this.readyPlayers.length !== readyCount) {
      player.sendMessage('room/startWithRobotReply', {errorCode: 2})
      return
    }

    player.sendMessage('room/startWithRobotReply', {errorCode: 0})
    for (let i = this.capacity - readyCount - 1; i >= 0; i--) {
      const npc = new NpcPlayer()
      this.join(npc)
      this.ready(npc)
    }
  }

  sortPlayer(zhuang) {
    if (zhuang) {
      const playersCopy = new Array(this.players.length)
      const newOrders = new Array(this.players.length)

      const zhuangIndex = this.players.indexOf(zhuang)
      for (let i = 0; i < playersCopy.length; i++) {
        let from = (zhuangIndex + i) % playersCopy.length
        playersCopy[i] = this.players[from]
        newOrders[i] = this.playersOrder[from]
      }
      this.players = playersCopy
      this.playersOrder = newOrders
    }
  }

  get rule() {
    return this.game.rule
  }

  private pushToSnapshot(newJoinPlayer: any) {
    if (~~this.snapshot.indexOf(newJoinPlayer)) {
      this.snapshot.push(newJoinPlayer)
    }
  }
}

export class PublicRoom extends Room {
  checkRoomInterval: NodeJS.Timer;

  constructor(rule) {
    super(rule)
    this.isPublic = true
    this.charge = this.chargePublicPlayers

    if (rule.diFen < 1000) {
      this.checkRoomInterval = setInterval(() => {
        const needPlayers = this.players.filter(p => !p).length
        const hasHuman = this.players.some(p => {
          return p && !p.isRobot()
        })
        if (hasHuman && needPlayers > 0) {

          redisClient.rpoplpush("profiles", "profiles", (err, profileString) => {
            if (err) return;
            try {
              const model = JSON.parse(profileString)
              const npc = new NpcPlayer(model)
              if (this.rule.diFen === 500) {
                npc.model.ruby += 50000
              }
              this.join(npc)
              this.ready(npc)
            } catch (e) {

            }
          })
        }
      }, ms('4s'))
    }
  }

  allOverMessage(): any {
    return {}
  }

  allOver(): boolean {
    return false
  }

  private cost(): number {
    return Math.round((this.rule.diFen || 50) / 2)
  }

  chargePublicPlayers() {
    let cost = this.cost()
    const playerManager = PlayerManager.getInstance()

    for (let player of this.snapshot) {
      const payee = playerManager.getPlayer(player.model._id) || player
      payee.model.ruby -= cost
      payee.sendMessage('resource/createRoomUsedRuby', {
        createRoomNeed: cost
      })
      PlayerModel.update({_id: player.model._id},
        {
          $inc: {
            ruby: -cost,
          },
        },
        (err) => {
          if (err) {
            logger.error(player.model, err)
          }
        })

      new ConsumeRecord({player: player.model._id, cost: cost / 10}).save()
    }
  }

  initScore() {

  }

  getScore(player) {
    if (player.model) {
      return player.model.gold || 0
    }
    return 0
  }

  recordGameScore() {
    return
  }

  async recordRoomScore() {
    return {}
  }

  addScore(playerId, v) {

    const robot = this.players.find(player => {
      return player && player.isRobot() && player.model._id === playerId
    })

    if (robot) {
      robot.model.ruby += v
      return
    }

    const playerManager = PlayerManager.getInstance()
    playerManager.addRuby(playerId, v)

    return
  }

  nextGame(thePlayer) {

    if (thePlayer.ruby <= Room.publicRoomLowestLimit(this.rule)) {
      thePlayer.sendMessage('room/join-fail', {reason: `钻石不足, 无法继续游戏`})
      return false
    }

    if (!this.isInRoom(thePlayer)) {
      thePlayer.sendMessage('room/join-fail', {reason: '你已经不属于这个房间.'})
      return false
    }

    this.announcePlayerJoin(thePlayer)

    this.cancelWaitNextGame(thePlayer)

    return true
  }

  gameOver(nextZhuangId, states) {
    this.clearPlayersIfPublic()
    return super.gameOver(nextZhuangId, states)
  }

  playerDisconnect(player) {
    if (super.playerDisconnect(player)) {
      if (!this.gameState) {
        this.leave(player)
        return true
      }
      return true
    }
    return false
  }


  leave(player) {
    if (super.leave(player)) {
      if (this.isEmpty()) {
        console.log('room empty')
        this.emit('empty', this.disconnected)
        clearInterval(this.checkRoomInterval)
        this.readyPlayers = []
      }
      return true

    } else {
      return false
    }
  }

  cancelWaitNextGame(player) {
    remove(this.waitNextGamePlayers, waitPlayer => waitPlayer === player)
  }

  waitNextGame(player) {
    this.waitNextGamePlayers.push(player)
  }

  private WAIT_NEXT_GAME_TIMEOUT = 30 * 1000

  countDownEvictWaiter() {
    setTimeout(() => {
      this.waitNextGamePlayers.forEach(player => this.leave(player))
    }, this.WAIT_NEXT_GAME_TIMEOUT)
  }

  private evictWaiterTimeout() {
    this.inRoomPlayers.forEach(player => this.waitNextGame(player))
    this.countDownEvictWaiter()
  }

  clearPlayersIfPublic() {
    this.evictWaiterTimeout()
    this.clearPlayersOrderBaseOnDisconnected()
    this.clearDisconnected()
  }

  clearPlayersOrderBaseOnDisconnected() {
    this.disconnected.forEach(([id, index]) => this.playersOrder[index] = null)
  }
}

export default Room

