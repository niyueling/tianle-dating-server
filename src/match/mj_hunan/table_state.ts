/**
 * Created by Color on 2016/7/6.
 */
import {random} from 'lodash'
import * as moment from 'moment'
import * as path from 'path'
import * as winston from 'winston'
import PlayerModel from '../../database/models/player'
import GameRecorder, {IGameRecorder} from '../../match/GameRecorder'
import huCardFactory from '../../test/match/huCardType'
import alg from '../../utils/algorithm'
import Room from '../room'
import ai from './ai'
import Enums from './enums'
import PlayerState from './player_state'
import Rule from './Rule'

const stateWaitDa = 1
const stateWaitAction = 2
const stateGameOver = 3
const stateWaitGangShangHua = 4
const stateWaitGangShangAction = 5
const stateQiangHaiDi = 6
const stateWaitDaHaiDi = 7
const stateWaitHaiDiPao = 8
const stateQiangGang = 9

class HuCheck {
  hu?: any[]
  card: number
  chiCombol?: any[]
  bu?: any
}

interface StateData {
  card?: number
  da?: PlayerState
  player?: PlayerState
  turn?: number
  current?: number
  msg?: any
  hu?: any
  currentIndex?: number[]
  lastMsg?: any[]
  hangUp?: any
  moreCanDoSomeThing?: any
  pengGang?: PlayerState
  HangUpPeng?: PlayerState
  checks?: HuCheck
  checkReduce?: any
  cards?: number[]
  gangPlayer?: PlayerState
  hangUpBu?: PlayerState
  HangUpGang?: PlayerState
  cancelQiang?: boolean
  whom?: PlayerState
  who?: PlayerState
  chiCombol?: any
  HangUpChi?: PlayerState,
  event?: string
  bu?: any
}

const getCanPengCards = (p, checks) => {
  const ret = []
  checks.forEach(x => {
    if (x.peng === p) {
      ret.push(x.card)
    }
  })
  return ret
}

const getCanGangCards = (p, checks, gangPlayer) => {
  const ret = []
  checks.forEach(x => {
    if (x.gang === p) {
      ret.push([x.card, p.getGangKind(x.card, p === gangPlayer)])
    }
  })
  return ret
}

const getCanBuCards = (p, checks, gangPlayer) => {
  const ret = []
  checks.forEach(x => {
    if (x.bu === p) {
      ret.push([x.card, p.getGangKind(x.card, p === gangPlayer)])
    }
  })
  return ret
}

const generateCards = function () {
  const cards = []
  const addSpan = function (start, end) {
    for (let c = start; c <= end; c += 1) {
      cards.push(c)
      cards.push(c)
      cards.push(c)
      cards.push(c)
    }
  }

  addSpan(Enums.wanzi1, Enums.wanzi9)
  addSpan(Enums.tongzi1, Enums.tongzi9)
  addSpan(Enums.shuzi1, Enums.shuzi9)
  // addSpan(Enums.dong, Enums.bai);

  cards.push(Enums.zhong)
  cards.push(Enums.zhong)
  cards.push(Enums.zhong)
  cards.push(Enums.zhong)

  return cards
}

function getTimeString() {
  return moment().format('YYYYMMDDHHmm')
}

class TableState {

  restJushu: number
  turn: number

  cards: number[]
  remainCards: number
  caishen: number

  players: PlayerState[]
  zhuang: PlayerState
  lastDa: PlayerState | null

  rule: Rule
  room: Room
  state: number

  logger: winston.LoggerInstance
  sleepTime: number

  stateData: StateData

  onRoomEmpty: () => void
  onReconnect: (any, index: number) => void

  recorder: IGameRecorder

  niaos: number[] = []

  constructor(room: Room, rule: Rule, restJushu: number) {
    this.restJushu = restJushu
    this.rule = rule
    const players = room.players.map(playerSocket => new PlayerState(playerSocket, room, rule))
    players[0].zhuang = true
    this.cards = generateCards()
    this.room = room
    this.listenRoom(room)
    this.remainCards = this.cards.length
    this.players = players
    this.zhuang = players[0]
    for (let i = 0; i < players.length; i++) {
      const p = players[i]
      this.listenPlayer(p)
    }
    this.turn = 1
    this.state = stateWaitAction
    this.lastDa = null

    const transports = []
    this.logger = new winston.Logger({transports})

    this.setGameRecorder(new GameRecorder(this))
  }

  shuffle() {
    alg.shuffle(this.cards)
    this.turn = 1
    this.remainCards = this.cards.length
  }

  consumeCard(player_: PlayerState) {
    const player = player_
    const cardIndex = --this.remainCards
    if (cardIndex === 0 && player) {
      player.takeLastCard = true
    }
    const card = this.cards[cardIndex]
    this.logger.info('consumeCard %s last-%s', card, cardIndex)
    return card
  }

  take13Cards(player: PlayerState) {
    const cards = []
    for (let i = 0; i < 13; i++) {
      cards.push(this.consumeCard(player))
    }
    return cards
  }

  fapai() {
    this.shuffle()
    // this.arrangeCaiShen()
    this.sleepTime = 0
    this.caishen = this.rule.useCaiShen ? Enums.zhong : Enums.slotNoCard

    const restCards = this.remainCards - (this.rule.playerCount * 13)
    for (let i = 0, iMax = this.players.length; i < iMax; i++) {
      const p = this.players[i]
      const cards13 = this.take13Cards(p)
      this.logger.info('fapai player-%s :%s', i, cards13)
      p.onShuffle(restCards, this.caishen, this.restJushu, cards13, i, this.room.game.juIndex)
    }

    const nextDo = () => {
      const nextCard = this.consumeCard(this.zhuang)
      const msg = this.zhuang.takeCard(this.turn, nextCard)
      this.logger.info('takeCard player-%s  take %s', this.zhuang._id, nextCard)

      const index = 0
      this.room.broadcast('game/oppoTakeCard', {index}, this.zhuang.msgDispatcher)
      this.state = stateWaitDa
      this.stateData = {msg, da: this.zhuang, card: nextCard}
    }

    if (this.sleepTime === 0) {
      nextDo()
    } else {
      setTimeout(nextDo, this.sleepTime)
    }
  }

  atIndex(player: PlayerState) {
    return this.players.indexOf(player)
  }

  listenPlayer(player) {
    const index = this.players.indexOf(player)
    player.registerHook('game/canDoSomething', msg => {
      player.emitter.emit('waitForDoSomeThing', msg)
    })
    player.registerHook('game/canDoSomethingGang', msg => {
      player.deposit(() => {
        player.emitter.emit('gangShangGuo', msg.turn)
      })
    })
    player.registerHook('game/kaiGangBuZhang', msg => {
      player.deposit(() => {
        if (msg.hu) {
          player.emitter.emit('gangShangKaiHuaGuo', msg.turn)
        }
      })
    })
    player.registerHook('game/takeHaiDiCard', msg => {
      player.deposit(() => {
        if (msg.hu) {
          player.emitter.emit('daHaiDi', msg.turn)
        }
      })
    })
    player.registerHook('game/canJieHaiDiPao', msg => {
      player.deposit(() => {
        if (msg.hu) {
          player.emitter.emit('guoHaiDiPao', msg.turn)
        }
      })
    })
    player.registerHook('game/xunWenHaiDi', msg => {
      player.deposit(() => {
        player.emitter.emit('buYaoHaiDi', msg.turn)
        player.sendMessage('game/depositBuYaoHaiDi', {turn: msg.turn})
      })
    })

    player.on('refreshQuiet', (p, idx) => {
      this.onRefreshQuiet(p, idx)
    })

    player.on('waitForDa', msg => {
      this.logger.info('waitForDa %s', JSON.stringify(msg))
      player.deposit(() => {
        console.log("table_state.js 183 ", "执行自动打")
        this.logger.info('takeCard player-%s  执行自动打', index)

        if (msg) {
          const takenCard = msg.card
          const todo = player.ai.onWaitForDa(msg, player.cards)
          switch (todo) {
            case Enums.gang:
              const gangCard = msg.gang[0][0]
              player.emitter.emit(Enums.gangBySelf, this.turn, gangCard)
              player.sendMessage('game/depositGangBySelf', {card: gangCard, turn: this.turn})
              break
            case Enums.hu:
              player.emitter.emit(Enums.hu, this.turn, takenCard)
              player.sendMessage('game/depositZiMo', {card: takenCard, turn: this.turn})
              break
            default:
              const card = player.ai.getUseLessCard(player.cards, takenCard)
              player.emitter.emit(Enums.da, this.turn, card)
              player.sendMessage('game/depositDa', {card, turn: this.turn})
              break
          }
        } else {
          const card = player.ai.getUseLessCard(player.cards, Enums.slotNoCard)
          player.emitter.emit(Enums.da, this.turn, card)
          player.sendMessage('game/depositDa', {card, turn: this.turn})
        }
      })
    })
    player.on('waitForDoSomeThing', msg => {
      player.deposit(() => {
        const card = msg.card
        const todo = player.ai.onCanDoSomething(msg, player.cards, card)
        switch (todo) {
          case Enums.peng:
            player.emitter.emit(Enums.peng, this.turn, card)
            player.sendMessage('game/depositPeng', {card, turn: this.turn})
            break
          case Enums.gang:
            player.emitter.emit(Enums.gangByOtherDa, this.turn, card)
            player.sendMessage('game/depositGangByOtherDa', {card, turn: this.turn})
            break
          case Enums.hu:
            player.emitter.emit(Enums.hu, this.turn, card)
            player.sendMessage('game/depositHu', {card, turn: this.turn})
            break
          case Enums.chi:
            player.emitter.emit(Enums.chi, this.turn, card, ...msg.chiCombol[0])
            player.sendMessage('game/depositChi', {card, turn: this.turn, chiCombol: msg.chiCombol[0]})
            break
          default:
            player.emitter.emit(Enums.guo, this.turn, card)
            break
        }
      })

      this.logger.info('waitForDoSomeThing player %s', index)
    })
    player.on('willTakeCard', denyFunc => {
      if (this.remainCards < 0) {
        denyFunc()
        this.gameOver()
        return
      }
      this.logger.info('willTakeCard player-%s', index)
    })

    player.on("mayQiaoXiang", () => {
      player.sendMessage("game/mayQiaoXiang", {info: '可以敲响'})
      this.logger.info('mayQiaoXiang player %s', index)
    })

    player.on("qiaoXiang", ({qiao}) => {
      this.logger.info('qiaoXiang player-%s qiao :%s ', index, qiao)
      if (qiao) {
        player.setQiaoXiang()
        this.room.broadcast('game/otherQiaoXiang', {player: index})
      }
      player.stashPopTakeCard()
    })

    player.on(Enums.da, (turn, card_) => {
      this.logger.info('da player-%s card:%s', index, card_)
      let from

      const card = card_
      if (this.state !== stateWaitDa) {
        player.sendMessage('DaReply', {errorCode: 1, info: '不能打牌'})
        this.logger.info('da player-%s card:%s 不能打牌', index, card_)
        return
      } else if (this.stateData[Enums.da] !== player) {
        player.sendMessage('DaReply', {errorCode: 2, info: '不是你的回合'})
        this.logger.info('da player-%s card:%s 不是你的回合', index, card_)
        return
      }

      const ok = player.daPai(card)
      if (ok) {
        this.lastDa = player
        player.cancelTimeout()
        player.sendMessage('DaReply', {errorCode: 0})
        this.room.broadcast('game/oppoDa', {index, card}, player.msgDispatcher)

        if (player.isTing()) {
          if (player.events[Enums.anGang] && player.events[Enums.anGang].length > 0) {
            player.sendMessage('game/showAnGang',
              {index, cards: player.events[Enums.anGang]})
            this.room.broadcast('game/oppoShowAnGang',
              {index, cards: player.events[Enums.anGang]}
              , player.msgDispatcher)
          }
        }
      } else {
        player.sendMessage('DaReply', {errorCode: 3, info: '不能打这张牌'})
        this.logger.info('da player-%s card:%s 不能打这张牌', index, card_)
        return
      }

      from = this.atIndex(this.lastDa)
      this.turn++

      if (this.remainCards === 4) {
        this.room.broadcast('game/lastFour', {})
        this.logger.info('game/lastFour')
      }
      if (this.remainCards === 1) {
        this.room.broadcast('game/lastOne', {})
        this.logger.info('game/lastOne')
      }

      let check: HuCheck = {card}
      for (let j = 1; j < this.players.length; j++) {
        const result = {card}
        const i = (index + j) % this.players.length
        const p = this.players[i]
        const r = p.markJiePao(card, result)
        if (r.hu) {
          if (!check.hu) check.hu = []
          check.hu.push(p)
        }
      }

      const xiajia = this.players[(index + 1) % this.players.length]

      if (xiajia.contacted(this.lastDa) < 2) {
        check = xiajia.checkChi(card, check)
      }

      for (let j = 1; j < this.players.length; j++) {
        const i = (index + j) % this.players.length
        const p = this.players[i]
        if (p.contacted(this.lastDa) < 2) {
          check = p.checkPengGang(card, check)
        }
      }

      if (check[Enums.chi] || check[Enums.pengGang] || check[Enums.hu]) {
        this.state = stateWaitAction
        this.stateData = check
        this.stateData.hangUp = []

        if (check[Enums.hu]) {
          this.stateData.currentIndex = []
          this.stateData.lastMsg = []
          const things = []
          check[Enums.hu].forEach(x => {
            this.stateData.currentIndex.push(this.players.indexOf(x))

            let canChi = check[Enums.chi] === x

            if (check[Enums.pengGang] && check[Enums.pengGang] !== x) {
              canChi = false
            }

            if (check[Enums.hu].length > 1) {
              canChi = false
            }

            things.push({
              card,
              turn: this.turn,
              hu: true,
              chi: canChi,
              chiCombol: canChi && check.chiCombol,
              peng: check[Enums.peng] === x && check[Enums.hu].length === 1,
              gang: check[Enums.gang] === x && check[Enums.hu].length === 1,
              bu: check.bu === x,
              from
            })
          })
          const firstCanHu = check[Enums.hu][0]
          const firstThing = things.shift()

          this.stateData.lastMsg = [firstCanHu.sendMessage('game/canDoSomething', firstThing)]

          if (firstThing.gang) {
            firstCanHu.gangForbid.push(card)
          }

          this.logger.info('da player-%s game/canDoSomething %s', this.atIndex(firstCanHu), JSON.stringify(firstThing))

          this.stateData.moreCanDoSomeThing = things

        } else if (check[Enums.pengGang]) {
          const x = check[Enums.pengGang]
          const pengGangPlayerIndex = this.atIndex(x)
          this.stateData.currentIndex = [this.players.indexOf(x)]
          const thing = {
            card,
            turn: this.turn,
            peng: true,
            gang: check[Enums.gang] === x,
            bu: check.bu === x,
            chi: check[Enums.chi] === x,
            chiCombol: check[Enums.chi] === x && check.chiCombol,
            from
          }
          this.stateData.lastMsg = [x.sendMessage('game/canDoSomething', thing)]

          if (thing.gang) {
            x.gangForbid.push(card)
          }

          this.logger.info('da player-%s game/canDoSomething %s', pengGangPlayerIndex, JSON.stringify(thing))

        } else if (check[Enums.chi]) {
          this.stateData.currentIndex = [this.players.indexOf(check[Enums.chi])]
          const player = check[Enums.chi]
          const thing = {
            card,
            turn: this.turn,
            chi: true,
            chiCombol: check.chiCombol,
          }

          this.stateData.lastMsg = [
            player.sendMessage('game/canDoSomething', thing)
          ]
          this.logger.info('da player-%s game/canDoSomething %s', this.atIndex(player), JSON.stringify(thing))
        }
      } else {
        if (this.remainCards == 0) {
          this.logger.info('da player-%s no remainCards', index)
        }
        const newCard = this.consumeCard(xiajia)
        const msg = xiajia.takeCard(this.turn, newCard)
        this.logger.info('da player-%s  takeCard%s  msg  %s', this.atIndex(xiajia), newCard, JSON.stringify(msg))

        if (!msg) {
          return
        }
        this.state = stateWaitDa
        this.stateData = {da: xiajia, card: newCard, msg}
        const sendMsg = {index: this.players.indexOf(xiajia)}
        this.room.broadcast('game/oppoTakeCard', sendMsg, xiajia.msgDispatcher)
        this.logger.info('da broadcast game/oppoTakeCard   msg %s', JSON.stringify(sendMsg))
      }
    })
    player.on(Enums.chi, (turn, card, otherCard1, otherCard2) => {
      this.logger.info('chi player-%s ', index, )

      if (this.turn !== turn) {
        player.sendMessage('ChiReply', {errorCode: 1})
        return
      }

      if (this.state !== stateWaitAction) {
        player.sendMessage('ChiReply', {errorCode: 6})
        return
      }
      if (this.hasPlayerHu()) {
        player.sendMessage('ChiReply', {errorCode: 2})
        player.lockMessage()
        player.emitter.emit(Enums.guo, turn, card)
        player.unlockMessage()
        return
      }
      if (this.stateData[Enums.chi] !== player) {
        player.sendMessage('ChiReply', {errorCode: 3})
        return
      }
      if (this.stateData.hu && this.stateData.hu.contains(player)) {
        this.stateData.hu.remove(player)
      }
      if (this.stateData.pengGang === player) {
        this.stateData.pengGang = null
      }
      if ((this.stateData.pengGang && this.stateData.pengGang !== player) ||
        (this.stateData.hu && this.stateData.hu.find(x => x !== player))) {
        this.stateData.hangUp.push([player, Enums.chi, [turn, card, otherCard1, otherCard2]])

        player.sendMessage('ChiReply', {errorCode: 7, msg: '目前不能吃'})

        return
      }

      const ok = player.chiPai(card, otherCard1, otherCard2, this.lastDa)
      if (ok) {
        this.turn++
        this.state = stateWaitDa
        this.stateData = {da: player}

        const gangSelection = player.getAvailableGangs()
        player.sendMessage('ChiReply', {errorCode: 0, turn: this.turn, gang: gangSelection.length > 0, gangSelection})
        this.room.broadcast('game/oppoChi', {
          card,
          turn,
          index,
          suit: [otherCard1, otherCard2]
        }, player.msgDispatcher)
      } else {
        player.sendMessage('ChiReply', {errorCode: 4})
      }
    })
    player.on(Enums.peng, (turn, card) => {
      if (this.turn !== turn) {
        player.sendMessage('PengReply', {errorCode: 1})
        return
      }
      if (this.state !== stateWaitAction) {
        player.sendMessage('PengReply', {errorCode: 6})
        return
      }
      if (this.hasPlayerHu()) {
        this.logger.info('peng player-%s card:%s but has player hu', index, card)
        player.sendMessage('PengReply', {errorCode: 2})
        player.lockMessage()
        player.emitter.emit(Enums.guo, turn, card)
        player.unlockMessage()
        return
      }

      if (this.stateData.pengGang !== player || this.stateData.card !== card) {
        this.logger.info('peng player-%s card:%s has player pengGang or curCard not is this card', index, card)
        player.sendMessage('PengReply', {errorCode: 3, msg: '错误的碰'})
        return
      }

      const playersToHu = this.stateData[Enums.hu]

      if (playersToHu && playersToHu.length > 0 && !this.stateData[Enums.hu].contains(player)) {
        this.logger.info('peng player-%s card:%s has player hu ,not contain self', index, card)
        this.stateData.HangUpPeng = player
        this.stateData.hangUp.push([player, Enums.peng, [turn, card]])
        return
      }

      const ok = player.pengPai(card, this.lastDa)
      if (ok) {
        const hangUpList = this.stateData.hangUp
        this.turn++
        this.state = stateWaitDa
        const nextStateData = {da: player}
        const gangSelection = player.getAvailableGangs()
        player.sendMessage('PengReply', {errorCode: 0, turn: this.turn, gang: gangSelection.length > 0, gangSelection})
        for (const gangCard of gangSelection) {
          player.gangForbid.push(gangCard[0])
        }

        this.stateData = nextStateData
        const from = this.atIndex(this.lastDa)
        const me = this.atIndex(player)

        for (let i = 1; i < 4; i++) {
          const index = (from + i ) % this.players.length
          if (index === me) {
            break
          }
          this.players[index].huForbidden = 0
          this.players[index].pengForbidden = []
        }

        this.room.broadcast('game/oppoPeng', {
          card,
          index,
          turn, from
        }, player.msgDispatcher)
        if (hangUpList.length > 0) {    // 向所有挂起的玩家回复
          hangUpList.forEach(hangUpMsg => {
            hangUpMsg[0].emitter.emit(hangUpMsg[1], ...hangUpMsg[2])
          })
        }
      } else {
        this.logger.info('PengReply player-%s card:%s has player hu ,not contain self', index, card)
        player.sendMessage('PengReply', {errorCode: 4})
        return
      }

      console.log(player.name, 'Peng', card)
    })
    player.on(Enums.gangByOtherDa, (turn, card) => {
      if (this.turn !== turn) {
        this.logger.info('gangByOtherDa player-%s card:%s turn not eq', index, card)
        player.sendMessage('GangReply', {errorCode: 1})
        return
      }
      if (this.state !== stateWaitAction) {
        this.logger.info('gangByOtherDa player-%s card:%s state not is wait ', index, card)
        player.sendMessage('GangReply', {errorCode: 6})
        return
      }
      if (this.hasPlayerHu()) {
        this.logger.info('gangByOtherDa player-%s card:%s has player hu ', index, card)
        player.sendMessage('GangReply', {errorCode: 2})
        player.lockMessage()
        player.emitter.emit(Enums.guo, turn, card)
        player.unlockMessage()
        return
      }
      if (this.stateData[Enums.pengGang] !== player || this.stateData.card !== card) {
        this.logger.info('gangByOtherDa player-%s card:%s has another player pengGang', index, card)
        player.sendMessage('GangReply', {errorCode: 3})
      } else if (this.stateData[Enums.hu] && this.stateData[Enums.hu].find(x => x !== player)) {
        this.logger.info('gangByOtherDa player-%s card:%s has another player hu', index, card)
        this.stateData.hangUp.push([player, Enums.gangByOtherDa, [turn, card]])
        return
      }

      const hangUpList = this.stateData.hangUp
      const ok = player.gangByPlayerDa(card, this.lastDa)
      if (ok) {
        this.turn++
        player.sendMessage('GangReply', {errorCode: 0})

        const from = this.atIndex(this.lastDa)
        const me = this.atIndex(player)
        for (let i = 1; i < 4; i++) {
          const index = (from + i ) % this.players.length
          if (index === me) {
            break
          }
          this.players[index].huForbidden = 0
          this.players[index].pengForbidden = []
        }

        this.room.broadcast(
          'game/oppoGangByPlayerDa',
          {card, index, turn, from: this.atIndex(this.lastDa)},
          player.msgDispatcher
        )

        if (player.isTing()) {
          this.logger.info('gangByOtherDa player-%s card:%s ting', index, card)
          if (player.events[Enums.anGang] && player.events[Enums.anGang].length > 0) {
            player.sendMessage('game/showAnGang',
              {index, cards: player.events[Enums.anGang]})
            this.room.broadcast('game/oppoShowAnGang',
              {index, cards: player.events[Enums.anGang]}
              , player.msgDispatcher)
          }
        }
        this.logger.info('gangByOtherDa player-%s card:%s gang ok, take card', index, card)

        const nextCard = this.consumeCard(player)
        const msg = player.gangTakeCard(this.turn, nextCard)
        if (msg) {
          this.room.broadcast('game/oppoTakeCard', {index}, player.msgDispatcher)
          this.state = stateWaitDa
          this.stateData = {da: player, card: nextCard, msg}
          if (hangUpList.length > 0) {    // 向所有挂起的玩家回复
            hangUpList.forEach(hangUpMsg => {
              hangUpMsg[0].emitter.emit(hangUpMsg[1], ...hangUpMsg[2])
            })
          }
        }
      } else {
        this.logger.info('gangByOtherDa player-%s card:%s GangReply error:4', index, card)
        player.sendMessage('GangReply', {errorCode: 4})
        return
      }

      console.log(player.name, 'Gang', card)
    })

    player.on(Enums.gangBySelf, (turn, card) => {

      if (this.turn !== turn) {
        player.sendMessage('GangReply', {errorCode: 1})
      } else if (this.state !== stateWaitDa) {
        player.sendMessage('GangReply', {errorCode: 2})
      } else if (this.stateData[Enums.da] !== player) {
        console.log(this.stateData)
        player.sendMessage('GangReply', {errorCode: 3})
      } else {
        const isAnGang = player.cards[card] >= 3

        this.turn++

        const broadcastMsg = {turn: this.turn, card, index}

        if (!isAnGang) {
          const qiangGangCheck: HuCheck = {card}
          let qiang = null

          const gangIndex = this.atIndex(player)

          for (let i = 1; i < this.players.length; i++) {
            const index = (gangIndex + i) % this.players.length
            const otherPlayer = this.players[index]

            if (otherPlayer != player) {
              otherPlayer.markJiePao(card, qiangGangCheck, true)
            }
            if (qiangGangCheck.hu) {
              qiang = otherPlayer
              break
            }
          }

          if (qiang && !this.stateData.cancelQiang) {
            this.room.broadcast('game/oppoGangBySelf', broadcastMsg, player.msgDispatcher)
            qiang.sendMessage('game/canDoSomething', {
              card, turn: this.turn, hu: true,
              chi: false, chiCombol: [],
              peng: false, gang: false, bu: false,
            })

            this.state = stateQiangGang
            this.stateData = {
              whom: player,
              who: qiang,
              event: Enums.gangBySelf,
              card, turn: this.turn
            }
            return
          }
        }

        const ok = player.gangBySelf(card, broadcastMsg)
        if (ok) {
          player.sendMessage('GangReply', {errorCode: 0})

          if (!this.stateData.cancelQiang) {
            this.room.broadcast('game/oppoGangBySelf', broadcastMsg, player.msgDispatcher)
          }

          if (player.isTing()) {
            if (player.events[Enums.anGang] && player.events[Enums.anGang].length > 0) {
              player.sendMessage('game/showAnGang',
                {index, cards: player.events[Enums.anGang]})
              this.room.broadcast('game/oppoShowAnGang',
                {index, cards: player.events[Enums.anGang]}
                , player.msgDispatcher)
            }
          }

          const nextCard = this.consumeCard(player)
          const msg = player.gangTakeCard(this.turn, nextCard)
          if (!msg) {
            return
          }
          this.room.broadcast('game/oppoTakeCard', {index}, player.msgDispatcher)
          this.state = stateWaitDa
          this.stateData = {msg, da: player, card: nextCard}

        } else {
          player.sendMessage('GangReply', {errorCode: 4, message: '杠不进'})
        }
      }
    })
    player.on(Enums.buBySelf, (turn, card) => {
      if (this.turn !== turn) {
        player.sendMessage('BuReply', {errorCode: 1})
      } else if (this.state !== stateWaitDa) {
        player.sendMessage('BuReply', {errorCode: 2})
      } else if (this.stateData[Enums.da] !== player) {
        console.log(this.stateData)
        player.sendMessage('BuReply', {errorCode: 3})
      } else {
        const broadcastMsg = {turn, card, index}
        const ok = player.buBySelf(card, broadcastMsg)
        if (ok) {
          player.sendMessage('BuReply', {errorCode: 0})
          this.room.broadcast('game/oppoBuBySelf', broadcastMsg, player.msgDispatcher)
          this.turn++
          const nextCard = this.consumeCard(player)
          const msg = player.takeCard(this.turn, nextCard)
          if (!msg) {
            return
          }
          this.room.broadcast('game/oppoTakeCard', {index}, player.msgDispatcher)
          this.state = stateWaitDa
          this.stateData = {msg, da: player, card: nextCard}
        } else {
          player.sendMessage('BuReply', {errorCode: 4})
        }
      }
    })
    player.on(Enums.hu, (turn, card) => {
      this.logger.info('hu  player %s ', index, )

      if (this.turn !== turn) {
        player.sendMessage('HuReply', {errorCode: 1})
      } else {
        const recordCard = this.stateData.card
        if (this.state === stateWaitAction &&
          recordCard === card &&
          this.stateData[Enums.hu].contains(player)) {

          const chengbaoStarted = this.remainCards <= 3

          const ok = player.jiePao(card, turn === 2, this.remainCards == 0, this.lastDa)
          this.logger.info('hu  player %s jiepao %s', index, ok)

          if (ok) {
            const hangUpList = this.stateData.hangUp
            if (hangUpList.length > 0) {    // 向所有挂起的玩家回复
              this.stateData.hangUp = []
              hangUpList.forEach(hangUpMsg => {
                hangUpMsg[0].emitter.emit(hangUpMsg[1], ...hangUpMsg[2])
              })
            }
            player.sendMessage('HuReply', {errorCode: 0})
            this.stateData[Enums.hu].remove(player)
            this.lastDa.recordGameEvent(Enums.dianPao, player.events[Enums.hu][0])
            if (chengbaoStarted) {
              this.lastDa.recordGameEvent(Enums.chengBao, {})
            }
            this.room.broadcast('game/oppoHu', {turn, card, index}, player.msgDispatcher)

            const huPlayerIndex = this.atIndex(player)
            for (let i = 1; i < this.players.length; i++) {
              const index = (huPlayerIndex + i) % this.players.length
              const nextPlayer = this.players[index]
              if (nextPlayer === this.lastDa) {
                break
              }

              if (nextPlayer.checkJiePao(card)) {
                nextPlayer.jiePao(card, turn === 2, this.remainCards === 0, this.lastDa)
                nextPlayer.sendMessage('game/genHu', {})
                this.room.broadcast('game/oppoHu', {turn, card, index}, nextPlayer.msgDispatcher)
              }
            }

            this.gameOver()
            this.logger.info('hu  player %s gameover', index)

          } else {
            player.sendMessage('HuReply', {errorCode: 2})
          }

        } else if (this.state === stateWaitDa && recordCard === card) {
          const ok = player.zimo(card, turn === 1, this.remainCards === 0)
          if (ok) {
            player.sendMessage('HuReply', {errorCode: 0})
            this.room.broadcast('game/oppoZiMo', {turn, card, index}, player.msgDispatcher)
            this.gameOver()
            this.logger.info('hu  player %s zimo gameover', index)
          } else {
            player.sendMessage('HuReply', {errorCode: 2, info: '不成胡'})
          }
        } else if (this.state === stateQiangGang) {

          if (this.stateData.who === player && turn === this.stateData.turn) {
            player.cards.qiangGang = true

            const checkJiePao = player.jiePao(card, turn === 2, this.remainCards === 0, this.stateData.whom)
            this.logger.info('hu  player %s stateQiangGang jiePao %s', index, checkJiePao)
            if (checkJiePao) {
              player.sendMessage('HuReply', {errorCode: 0})
              this.stateData.whom.recordGameEvent(Enums.dianPao, player.events[Enums.hu][0])
              // this.stateData.whom.recordGameEvent(Enums.chengBao, {})
              this.room.broadcast('game/oppoHu', {turn, card, index}, player.msgDispatcher)

              const huPlayerIndex = this.atIndex(player)
              for (let i = 1; i < this.players.length; i++) {
                const index = (huPlayerIndex + i) % this.players.length
                const nextPlayer = this.players[index]
                if (nextPlayer === this.stateData.whom) {
                  break
                }

                if (nextPlayer.checkJiePao(card, true)) {
                  nextPlayer.cards.qiangGang = true
                  nextPlayer.jiePao(card, turn === 2, this.remainCards === 0, this.stateData.whom)
                  nextPlayer.sendMessage('game/genHu', {})
                  this.room.broadcast('game/oppoHu', {turn, card, index}, nextPlayer.msgDispatcher)
                }
              }

              this.gameOver()
              this.logger.info('hu  player %s stateQiangGang jiePao gameOver', index)
            } else {
              player.cards.qiangGang = false
            }
          } else {
            player.sendMessage('HuReply', {errorCode: 2, message: '不是你能抢'})
            this.logger.info('hu  player %s stateQiangGang 不是你能抢', index)
          }
        } else {
          player.sendMessage('HuReply', {errorCode: 3})
          this.logger.info('hu  player %s stateQiangGang HuReply', index)
        }
      }
    })

    player.on(Enums.guo, (turn, card) => {
      this.logger.info('guo  player %s card %s', index, card)
      const from = this.atIndex(this.lastDa)

      if (this.turn !== turn) {
        player.sendMessage('GuoReply', {errorCode: 1})
      } else if (this.state !== stateWaitAction && this.state !== stateQiangGang) {
        player.sendMessage('GuoReply', {errorCode: 2})
      } else if (this.state === stateQiangGang && this.stateData.who == player) {
        this.logger.info('stateQiangGang player-%s ', index)

        player.sendMessage('GuoReply', {errorCode: 0})

        const {whom, card, turn} = this.stateData
        this.state = stateWaitDa
        this.stateData = {[Enums.da]: whom, cancelQiang: true}
        whom.emitter.emit(Enums.gangBySelf, turn, card)

      } else {
        let legal = false
        if (this.stateData[Enums.hu] && this.stateData[Enums.hu].contains(player)) {
          this.stateData[Enums.hu].remove(player)
          legal = true
        }

        const hasHu = this.stateData[Enums.hu] && this.stateData[Enums.hu].length > 0

        if (this.stateData[Enums.pengGang] === player && !hasHu) {
          delete this.stateData[Enums.pengGang]
          delete this.stateData[Enums.peng]
          delete this.stateData[Enums.gang]
          legal = true
        }
        if (this.stateData[Enums.chi] === player && !this.stateData[Enums.pengGang]) {
          delete this.stateData[Enums.chi]
          legal = true
        }
        if (legal) {
          player.sendMessage('GuoReply', {errorCode: 0})
          player.guoOption(card)
        } else {
          player.sendMessage('GuoReply', {errorCode: 3})
        }

        if (this.stateData.hangUp.length > 0) {    // 向所有挂起的玩家回复
          const hangUpList = this.stateData.hangUp
          this.stateData.hangUp = []
          hangUpList.forEach(hangUpMsg => {
            hangUpMsg[0].emitter.emit(hangUpMsg[1], ...hangUpMsg[2])
          })
          return
        }
        const huPlayers = this.stateData[Enums.hu]
        if (huPlayers == null || huPlayers.length === 0) {
          if (this.players.find(x => x.isHu())) {
            this.logger.info('guo has player hu game over')
            this.gameOver()
            return
          }
          if (this.stateData[Enums.pengGang]) {
            const x = this.stateData[Enums.pengGang]
            this.stateData.currentIndex = [this.players.indexOf(x)]
            const thing = {
              card,
              turn: this.turn,
              peng: true,
              gang: this.stateData[Enums.gang] === x,
              bu: this.stateData.bu === x,
              chi: this.stateData[Enums.chi] === x,
              chiCombol: this.stateData[Enums.chi] === x && this.stateData.chiCombol,
              from
            }
            this.stateData.lastMsg = [x.sendMessage('game/canDoSomething', thing)]
            this.logger.info('antoher player-%s game/canDoSomething %s', this.atIndex(x), JSON.stringify(thing))
          } else if (this.stateData[Enums.chi]) {
            const x = this.stateData[Enums.chi]
            this.stateData.currentIndex = [this.players.indexOf(x)]
            const thing = {
              turn,
              card,
              chi: true,
              chiCombol: this.stateData.chiCombol,
              from
            }
            this.stateData.lastMsg = [
              x.sendMessage('game/canDoSomething', thing),
            ]
            this.logger.info('another player-%s game/canDoSomething %s', this.atIndex(x), JSON.stringify(thing))
          } else {
            this.turn++
            const xiajiaIndex = (this.players.indexOf(this.lastDa) + 1) % this.players.length
            const xiajia = this.players[xiajiaIndex]
            const nextCard = this.consumeCard(xiajia)
            const msg = xiajia.takeCard(this.turn, nextCard)
            if (!msg) {
              return
            }
            this.state = stateWaitDa
            this.stateData = {
              da: xiajia,
              card: nextCard,
              msg,
            }
            this.room.broadcast('game/oppoTakeCard', {index: xiajiaIndex}, xiajia.msgDispatcher)
            this.logger.info('xiajia player-%s game/oppoTakeCard %s', xiajiaIndex, JSON.stringify(msg))
          }
        } else {
          //还有可以胡的用户
          const player = this.stateData[Enums.hu][0]
          const msg = this.stateData.moreCanDoSomeThing.shift()
          player.sendMessage('game/canDoSomething', msg)
          this.logger.info('guo another player %s canDoSomeThing %s', this.atIndex(player), JSON.stringify(msg))
        }
      }
    })

    player.on('lastDa', () => {
      this.players.forEach(x => {
        if (x !== player) {
          x.clearLastDaFlag()
        }
      })
    })
    player.on('recordZiMo', huResult => {
      this.players.forEach(x => {
        if (x !== player) {
          x.recordGameEvent(Enums.taJiaZiMo, huResult)
        }
      })
    })
    player.on('recordAnGang', card => {
      this.players.forEach(x => {
        if (x !== player) {
          x.recordGameEvent(Enums.taJiaAnGang, card)
        }
      })
    })
    player.on('recordMingGangSelf', card => {
      this.players.forEach(x => {
        if (x !== player) {
          x.recordGameEvent(Enums.taJiaMingGangSelf, card)
        }
      })
    })
    player.on('qiShouHu', (info, showCards, restCards) => {
      this.sleepTime = 3000
      this.players.forEach(x => {
        if (x !== player) {
          x.recordGameEvent('taJiaQiShouHu', info)
        }
      })
      player.sendMessage('game/qiShouHu', {info, showCards, restCards})
      this.room.broadcast('game/oppoQiShouHu', {info, showCards, index}, player.msgDispatcher)
    })
    player.on('recordGangShangKaiHua', info => {
      this.players.forEach(x => {
        if (x !== player) {
          x.recordGameEvent('taJiaGangShangKaiHua', info)
        }
      })
    })
  }

  multiTimesSettleWithSpecial(states, specialId, times) {
    const specialState = states.find(s => s.model._id == specialId)

    console.log(`${__filename}:1577 multiTimesSettleWithSpecial`, specialState)

    if (specialState.score > 0) {
      for (const state of states) {
        state.score *= times
      }
    } else {
      const winState = states.find(s => s.score > 0)
      if (winState) {
        winState.score += specialState.score * -(times - 1)
        specialState.score *= times
      }
    }
  }

  generateNiao() {
    const niaos = []

    for (let i = 0; i < this.rule.feiNiao; i++) {
      const niaoPai = this.consumeCard(null)
      if (niaoPai) {
        niaos.push(niaoPai)
      }
    }

    return niaos
  }

  assignNiaos(niaos: number[]) {
    this.players.forEach(p => p.buyer = this.players[0])
    const nPlayers = this.players.length
    for (const niao of niaos) {
      const tail = niao % 10
      const index = (tail + nPlayers - 1 ) % nPlayers
      this.players[index].niaoCount += 1
    }
  }

  nextZhuang(): PlayerState {
    const currentZhuangIndex = this.atIndex(this.zhuang)
    const huPlayers = this.players.filter(p => p.huPai())

    let nextZhuangIndex = currentZhuangIndex

    if (huPlayers.length === 1) {
      nextZhuangIndex = this.atIndex(huPlayers[0])
    } else if (huPlayers.length > 1) {
      const loser = this.players.find(p => p.events[Enums.dianPao])
      nextZhuangIndex = this.atIndex(loser)
    }

    return this.players[nextZhuangIndex]
  }

  gameOver() {
    if (this.state !== stateGameOver) {
      this.state = stateGameOver

      const winner = this.players.filter(x => x.events.jiePao)[0]

      // 没胡牌 也没放冲
      if (winner) {
        this.players.filter(x => !x.events.jiePao && !x.events.dianPao)
          .forEach(x => {
            x.events.hunhun = winner.events.hu
          })
      }

      this.players.forEach(x => x.gameOver())
      this.room.removeListener('reconnect', this.onReconnect)
      this.room.removeListener('empty', this.onRoomEmpty)

      this.room.charge()

      const nextZhuang = this.nextZhuang()
      const niaos = this.generateNiao()
      this.assignNiaos(niaos)
      this.niaos = niaos

      const states = this.players.map((player, idx) => player.genGameStatus(idx, 1))
      const huPlayers = this.players
        .filter(p => p.huPai())

      huPlayers
        .forEach(huPlayer => {
          const losers = this.players.filter(p => p.events[Enums.dianPao] || p.events[Enums.taJiaZiMo])

          for (const loser of losers) {
            const wins = huPlayer.winScore()
            huPlayer.winFrom(loser, wins)
          }
        })

      if (huPlayers.length > 0) {
        this.players.forEach(playerToResolve => {
          const buGang = (playerToResolve.events.buGang || []).length
          const numAnGang = (playerToResolve.events.anGang || []).length
          const gangExtraGainsPerPlayer = numAnGang * 2 + buGang

          for (const player of this.players) {
            playerToResolve.winFrom(player, gangExtraGainsPerPlayer)
          }

          for (const gangFrom of playerToResolve.gangFrom) {
            playerToResolve.winFrom(gangFrom, 3)
          }
        })
      }

      states.forEach((state, i) => {
        state.model.played += 1
        state.score = this.players[i].balance * this.rule.diFen
        this.room.addScore(state.model._id, state.score)
      })

      this.room.recordGameScore(this, states)
      this.room.recordRoomScore()

      const gameOverMsg = {
        niaos,
        creator: this.room.creator.model._id,
        juShu: this.restJushu,
        juIndex: this.room.game.juIndex,
        useKun: this.rule.useKun,
        states,
        ruleType: this.rule.ruleType,
        isPublic: this.room.isPublic,
        caiShen: this.caishen,
        base: this.room.currentBase,
        maiDi: this.rule.maiDi
      }

      this.room.broadcast('game/game-over', gameOverMsg)
      this.room.gameOver(nextZhuang.model._id, states)

      this.logger.info('game/game-over  %s', JSON.stringify(gameOverMsg))
    }
    this.logger.close()
  }

  dissolve() {
    // TODO 停止牌局 托管停止 减少服务器计算消耗
    this.logger.close()
  }

  listenRoom(room) {
    room.on('reconnect', this.onReconnect = (playerMsgDispatcher, index) => {
      const player = this.players[index]
      player.reconnect(playerMsgDispatcher)
      player.sendMessage('game/reconnect', this.generateReconnectMsg(index))
    })

    room.once('empty', this.onRoomEmpty = () => {
      this.players.forEach(x => {
        x.gameOver()
      })
    })
  }

  onRefreshQuiet(playerMsgDispatcher, index) {
    const player = this.players[index]
    const reconnect = this.generateReconnectMsg(index)
    const rejoin = this.room.joinMessageFor(playerMsgDispatcher)

    player.sendMessage('game/reconnect', reconnect)
    player.sendMessage('room/rejoin', rejoin)
  }

  generateReconnectMsg(index) {
    const player = this.players[index]

    console.log(`${__filename}:1640 onReconnect`, index, player.model)

    const pushMsg = {
      index, status: [], remainCards: this.remainCards, base: this.room.currentBase,
      juIndex: this.room.game.juIndex, juShu: this.restJushu, current: {}
    }
    for (let i = 0; i < this.players.length; i++) {
      if (i === index) {
        pushMsg.status.push(this.players[i].genSelfStates(i))
      } else {
        pushMsg.status.push(this.players[i].genOppoStates(i))
      }
    }

    switch (this.state) {
      case stateWaitDa: {
        const daPlayer = this.stateData[Enums.da]
        if (daPlayer === player) {
          pushMsg.current = {
            index,
            state: 'waitDa',
            msg: this.stateData.msg,
          }
        } else {
          pushMsg.current = {index: this.players.indexOf(daPlayer), state: 'waitDa'}
        }
        break
      }
      case stateWaitAction: {
        const indices = this.stateData.currentIndex
        for (let i = 0; i < indices.length; i++) {
          if (indices[i] === index) {
            pushMsg.current = {index, state: 'waitAction', msg: this.stateData.lastMsg[i]}
            break
          }
        }
        break
      }
      case stateWaitGangShangHua: {
        if (this.stateData.player === player) {
          pushMsg.current = {
            index,
            state: 'waitGangShangHua',
            msg: this.stateData.msg,
          }
        } else {
          pushMsg.current = {index: this.players.indexOf(this.stateData.player), state: 'waitGangShangHua'}
        }
        break
      }
      case stateWaitGangShangAction: {
        const indices = this.stateData.currentIndex
        for (let i = 0; i < indices.length; i++) {
          if (indices[i] === index) {
            pushMsg.current = {index, state: 'waitGangShangAction', msg: this.stateData.lastMsg[i]}
            break
          }
        }
        break
      }
      case stateQiangHaiDi: {
        if (this.stateData.player === player) {
          pushMsg.current = {
            index,
            state: 'qiangHaiDi',
            msg: this.stateData.msg,
          }
        } else {
          pushMsg.current = {index: this.players.indexOf(this.stateData.player), state: 'qiangHaiDi'}
        }
        break
      }
      case stateWaitDaHaiDi: {
        if (this.stateData.player === player) {
          pushMsg.current = {
            index,
            state: 'waitDaHaiDi',
            msg: this.stateData.msg,
          }
        } else {
          pushMsg.current = {index: this.players.indexOf(this.stateData.player), state: 'waitDaHaiDi'}
        }
        break
      }
      case stateWaitHaiDiPao: {
        const indices = this.stateData.currentIndex
        for (let i = 0; i < indices.length; i++) {
          if (indices[i] === index) {
            pushMsg.current = {index, state: 'waitHaiDiPao', msg: this.stateData.lastMsg[i]}
            break
          }
        }
        break
      }
      default:
        break
    }

    return pushMsg
  }

  distance(p1, p2) {
    if (p1 === p2) {
      return 0
    }
    const p1Index = this.players.indexOf(p1)
    const len = this.players.length
    for (let i = 1; i < len; i++) {
      const p = this.players[(p1Index + i) % len]
      if (p === p2) {
        return i
      }
    }
    return -1
  }

  gangShangGoNext(index, player, buzhang, guo) {
    const xiajiaIndex = (index + 1) % this.players.length
    const xiajia = this.players[xiajiaIndex]
    const checks =
      buzhang.map(x => {
        const checkResult: HuCheck = {card: x}
        if (!guo) {
          player.checkGangShangGang(x, checkResult)
        }
        xiajia.checkChi(x, checkResult)
        for (let i = 1; i < this.players.length; i++) {
          const p = this.players[(index + i) % this.players.length]
          const hu = p.checkJiePao(x)
          if (hu) {
            if (!checkResult.hu) {
              checkResult.hu = [p]
            } else {
              checkResult.hu.push(p)
            }
          }
          p.checkPengGang(x, checkResult)
        }
        return checkResult
      })
    const checkReduce =
      checks.reduce((acc0_, x) => {
        const acc0 = acc0_
        if (x.hu) {
          if (acc0.hu == null) {
            acc0.hu = []
          }
          x.hu.forEach(h => (!acc0.hu.contains(h)) && acc0.hu.push(h))
        }
        if (x.peng) {
          if (acc0.pengGang == null) {
            acc0.pengGang = []
          }
          if (acc0.peng == null) {
            acc0.peng = []
          }
          (!acc0.pengGang.contains(x.peng)) && acc0.pengGang.push(x.peng)
          acc0.peng.push(x.peng)
        }
        if (x.bu) {
          if (acc0.pengGang == null) {
            acc0.pengGang = []
          }
          if (acc0.bu == null) {
            acc0.bu = []
          }
          (!acc0.pengGang.contains(x.bu)) && acc0.pengGang.push(x.bu)
          acc0.bu.push(x.bu)
        }
        if (x.gang) {
          if (acc0.pengGang == null) {
            acc0.pengGang = []
          }
          if (acc0.gang == null) {
            acc0.gang = []
          }
          (!acc0.pengGang.contains(x.gang)) && acc0.pengGang.push(x.gang)
          acc0.gang.push(x.gang)
        }
        if (x.chi) {
          acc0.chi = x.chi
          if (acc0.chiCombol == null) {
            acc0.chiCombol = []
          }
          if (!acc0.chiCombol.find(c => c[0] === x.card)) {
            acc0.chiCombol.push([x.card, x.chiCombol])
          }
        }
        return acc0
      }, {})
    if (checkReduce.hu || checkReduce.pengGang || checkReduce.chi) {
      this.state = stateWaitGangShangAction
      this.stateData = {checks, checkReduce, cards: buzhang, gangPlayer: player}
      this.stateData.currentIndex = []
      this.stateData.lastMsg = []
      if (checkReduce.hu != null && checkReduce.hu.length > 0) {
        console.log('can hu')
        checkReduce.hu.forEach(x => {
          this.stateData.currentIndex.push(this.players.indexOf(x))
          this.stateData.lastMsg.push(x.sendMessage('game/canDoSomethingGang', {
            cards: buzhang,
            turn: this.turn,
            hu: true,
            peng: checkReduce.peng && checkReduce.peng.contains(x),
            pengSelection: getCanPengCards(x, checks),
            gang: checkReduce.gang && checkReduce.gang.contains(x),
            gangSelection: getCanGangCards(x, checks, player),
            bu: checkReduce.bu && checkReduce.bu.contains(x),
            buSelection: getCanBuCards(x, checks, player),
            chi: checkReduce.chi === x,
            chiCombol: checkReduce.chi === x && checkReduce.chiCombol,
          }))
        })
      } else if (checkReduce.pengGang != null && checkReduce.pengGang.length > 0) {

        checkReduce.pengGang.sort((a, b) => this.distance(player, a) - this.distance(player, b))
        const first = checkReduce.pengGang[0]
        this.stateData.currentIndex.push(this.players.indexOf(first))
        this.stateData.lastMsg.push(first.sendMessage('game/canDoSomethingGang', {
          cards: buzhang,
          turn: this.turn,
          peng: checkReduce.peng && checkReduce.peng.contains(first),
          pengSelection: getCanPengCards(first, checks),
          gang: checkReduce.gang && checkReduce.gang.contains(first),
          gangSelection: getCanGangCards(first, checks, player),
          bu: checkReduce.bu && checkReduce.bu.contains(first),
          buSelection: getCanBuCards(first, checks, player),
          chi: checkReduce.chi === first,
          chiCombol: checkReduce.chi === first && checkReduce.chiCombol,
        }))
      } else if (checkReduce.chi) {
        console.log('can chi')
        this.stateData.currentIndex.push(this.players.indexOf(checkReduce.chi))
        this.stateData.lastMsg.push(
          checkReduce.chi.sendMessage('game/canDoSomethingGang', {
            cards: buzhang,
            turn: this.turn,
            chi: true,
            chiCombol: checkReduce.chiCombol,
          }))
      }
    } else {
      console.log('can do nothing')
      const nextCard = this.consumeCard(xiajia)
      const msg = xiajia.takeCard(this.turn, nextCard)
      if (!msg) {
        return
      }
      this.state = stateWaitDa
      this.stateData = {
        da: xiajia,
        card: nextCard,
        msg,
      }
      this.room.broadcast('game/oppoTakeCard', {
        index: this.players.indexOf(xiajia),
      }, xiajia.msgDispatcher)
    }
  }

  hasPlayerHu() {
    return this.players.find(x => x.isHu()) != null
  }

  setGameRecorder(recorder) {
    this.recorder = recorder
    for (const p of this.players) {
      p.setGameRecorder(recorder)
    }
  }

  arrangeCaiShen() {
    const caiShen = this.cards[0]
    const cardsWithoutCaiShen = this.cards.filter(c => c !== caiShen)

    const newCards = [caiShen]

    const caiShenIndex = [
      random(3, 13 * 4),
      random(13 * 4 + 8, 13 * 4 + 16),
      random(13 * 4 + 40, 13 * 4 + 48)]
      .map(i => i + 33)

    let nextCaiIndex = caiShenIndex.shift()
    for (let i = 1; i < this.cards.length; i++) {
      if (i === nextCaiIndex) {
        newCards.push(caiShen)
        nextCaiIndex = caiShenIndex.shift()
      } else {
        newCards.push(cardsWithoutCaiShen.shift())
      }
    }

    this.cards = newCards.reverse()

  }
}

export default TableState
