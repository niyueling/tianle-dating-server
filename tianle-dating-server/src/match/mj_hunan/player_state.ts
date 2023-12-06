/**
 * Created by Color on 2016/7/7.
 */
import * as logger from 'winston'
import * as EventEmitter from 'events'
import {random} from 'lodash'
import Enums from './enums'
import HuPaiDetect from './HuPaiDetect'
import {DummyRecorder} from '../GameRecorder'
import Rule from './Rule'
import {IGameRecorder} from '../GameRecorder'
import Room from '../room'
import basicAi, {playerAi} from './ai'


export class SourceCardMap extends Array<number> {
  first: boolean
  haiDi: boolean
  takeSelfCard: boolean
  lastTakeCard: number
  gang: boolean
  qiaoXiang: boolean
  caiShen: number
  turn: number
  alreadyTakenCard?: boolean
  qiangGang?: boolean

}

export const genCardArray = (cards) => {
  const cardArray = []
  const pushN = (c, n) => {
    for (let i = 0; i < n; i++) {
      cardArray.push(c)
    }
  }

  cards.forEach((v, c) => {
    pushN(c, v)
  })

  return cardArray
}

interface iAi {
  getUseLessCard(cards: any, currentCard: number): number;

  onWaitForDa(actions: any, cards: any): string;

  onCanDoSomething(actions: any, cards: any, card: any): string;
}


class PlayerState {
  ai: iAi
  room: Room
  zhuang: boolean = false
  ip: string
  cards: SourceCardMap
  dropped: Array<number>

  emitter: EventEmitter
  lastDa: boolean = false

  events: any

  recorder: IGameRecorder
  record: (event: string, card: number) => void

  rule: Rule
  model: any
  disconnectCallBack: (any) => void
  score: number

  contactCounter: { [playerId: string]: number }

  msgDispatcher: any
  onDeposit: any

  timeoutTask: any
  msgHook: any
  takeCardStash: any

  pengForbidden: Array<any>
  huForbidden: number
  lastOptions: any
  lastCardToken: number

  turn: number
  hadQiaoXiang: boolean = false
  tingPai: boolean = false
  caiShen: number
  lockMsg: boolean = false
  locked: boolean = false
  seatIndex: number

  _id: string
  takeLastCard: boolean

  base: number
  canDeposit: boolean = false
  alreadyTakenCard: boolean = false

  gang: boolean

  freeCard: number
  forbidCards: number[]
  extra: number

  gangFrom: this[] = []

  gangForbid: number[] = []


  balance: number = 0
  niaoCount: number = 0

  buyer: this
  fangGangCount: number = 0

  constructor(userSocket, room, rule) {
    this.room = room
    this.zhuang = false
    this.rule = rule
    this.ip = userSocket.getIpAddress()
    this.model = userSocket.model
    this.emitter = new EventEmitter()
    this.cards = new SourceCardMap(38).fill(0)
    this.score = room.getScore(userSocket)
    this.disconnectCallBack = (player) => {
      if (player === this.msgDispatcher) {
        this.onDisconnect()
      }
    }
    this.listenDispatcher(userSocket)
    this.msgDispatcher = userSocket
    this.events = {}
    this.dropped = []
    this.lastDa = false
    this.onDeposit = userSocket.isRobot()
    this.ai = userSocket.isRobot() ? basicAi : playerAi

    this.timeoutTask = null
    this.msgHook = {}
    this.takeCardStash = {}
    this.contactCounter = {}

    this.pengForbidden = []
    this.huForbidden = 0
    this.lastOptions = {}
    this.recorder = new DummyRecorder()
    this.alreadyTakenCard = false
  }

  setGameRecorder(r) {
    this.recorder = r
    this.record = (event, card) => this.recorder.recordUserEvent(this, event, card)
    return this
  }


  recordContact(player) {
    let playerId = player.model._id
    if (this.contactCounter[playerId]) {
      this.contactCounter[playerId] += 1
    } else {
      this.contactCounter[playerId] = 1
    }
  }

  guoOption(card) {

    if (this.lastOptions.peng) {
      this.pengForbidden.push(card)
    }

    if (this.lastOptions.hu) {
      this.cards.lastTakeCard = card
      this.turn = this.cards.turn = this.room.gameState.turn
      this.cards.takeSelfCard = false
      this.cards[card]++
      const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
      this.cards[card]--

      this.huForbidden = checkResult.fan
    }
  }


  contacted(player: PlayerState) {
    return 0
  }

  yaoHaiDi(turn: number, card: number) {
    this.lastCardToken = card
    this.cards[card]++
    const msg = {card, turn, hu: false}
    if (this.checkZiMo()) {
      msg.hu = true
    }
    return this.sendMessage('game/takeHaiDiCard', msg)
  }

  //杠完取牌
  gangTakeCard(turn, card) {
    return this.takeCard(turn, card, true)
  }

  stashPopTakeCard() {
    if (this.takeCardStash) {
      const {turn, card, gangGuo} = this.takeCardStash
      this.takeCard(turn, card, gangGuo, true)
      this.takeCardStash = null
    }
  }

  mayQiaoXiang() {
    this.emitter.emit('mayQiaoXiang',)
    this.deposit(() => {
      this.stashPopTakeCard()
    })
  }

  takeCard(turn: number, card: number, gangGuo: boolean = false, afterQiaoXiang = false) {
    // this.gang = gangGuo  // fanmeng 计算杠上开花
    let canTake = true
    this.emitter.emit('willTakeCard', () => {
      canTake = false
    })
    if (!canTake) {
      return null
    }
    // 敲响check
    // if (!afterQiaoXiang && !this.hadQiaoXiang && this.checkQiaoXiang()) {
    //   this.takeCardStash = {turn, card, gangGuo}
    //   this.mayQiaoXiang()
    //   return {};
    // }

    this.lastCardToken = card
    this.cards[card]++
    const msg = {card, turn, gang: null, hu: false}
    this.recorder.recordUserEvent(this, 'moPai', card)

    if (!this.hadQiaoXiang) {
      for (let i = 1; i < 38; i++) {

        if (this.gangForbid.indexOf(i) >= 0) continue

        if (this.cards[i] === 4) {
          if (!msg.gang) {
            msg.gang = [[i, 'anGang']]
          } else {
            msg.gang.push([i, 'anGang'])
          }
        }
        if (this.cards[i] === 1 && this.events.peng && this.events.peng.contains(i) && !this.isForbidForGang(i)) {
          if (!msg.gang) {
            msg.gang = [[i, 'mingGang']]
          } else {
            msg.gang.push([i, 'mingGang'])
          }
        }
      }

      if (msg.gang) {
        msg.gang.forEach(gangOpt => {
          if (gangOpt[1] === 'mingGang') {
            this.gangForbid.push(gangOpt[0])
          }
        })
      }

    }

    if (this.checkZiMo()) {
      if (this.hadQiaoXiang) {
        //不用选择 直接胡
        this.sendMessage('game/TakeCard', msg)
        this.emitter.emit('waitForDa', msg)
        this.room.gameState.stateData.card = card
        return this.emitter.emit(Enums.hu, this.turn, card)
      }
      msg.hu = true
    }
    if (gangGuo) {
      this.freeCard = card
    }

    const ret = this.sendMessage('game/TakeCard', msg)
    this.emitter.emit('waitForDa', msg)

    this.alreadyTakenCard = true

    return ret
  }

  buCard(turn, card) {
    this.takeCard(turn, card)
  }

  checkTingPai(gangCard) {
    const count = this.cards[gangCard]
    if (count === 4) {
      this.recordGameEvent(Enums.anGang, gangCard)
    } else if (count === 3) {
      this.recordGameEvent(Enums.mingGang, gangCard)
    } else if (count === 1) {
      this.recordGameEvent(Enums.mingGang, gangCard)
      this.removeGameEvent(Enums.peng, gangCard)
    }
    this.cards[gangCard] = 0
    const ting = HuPaiDetect.checkTingPai(this.cards, this.events, this.rule)
    this.cards[gangCard] = count
    if (count === 4) {
      this.removeGameEvent(Enums.anGang, gangCard)
    } else if (count === 3) {
      this.removeGameEvent(Enums.mingGang, gangCard)
    } else if (count === 1) {
      this.removeGameEvent(Enums.mingGang, gangCard)
      this.recordGameEvent(Enums.peng, gangCard)
    }
    return ting
  }

  checkChi(card, check) {
    return check
  }


  checkPengGang(card, map) {
    if (card === this.caiShen)
      return map

    if (card === Enums.bai) {
      card = this.caiShen
    }

    if (this.hadQiaoXiang)
      return map


    if (this.pengForbidden.indexOf(card) >= 0) {
      return map
    }

    const caiCount = this.cards[this.caiShen]
    this.cards[this.caiShen] = 0
    this.cards[this.caiShen] = this.cards[Enums.bai]
    this.cards[Enums.bai] = 0

    const refMap = map
    const c = this.cards[card]

    if (c >= 2) {
      refMap[Enums.pengGang] = this
      refMap.peng = this
      if (c >= 3) {
        refMap.gang = this
      }
    }
    this.cards[Enums.bai] = this.cards[this.caiShen]
    this.cards[this.caiShen] = caiCount

    return refMap
  }

  checkGangShangGang(card, map) {
    const refMap = map
    if (this.cards[card] === 3 || (this.events.peng && this.events.peng.contains(card))) {
      // if (this.checkTingPai(card)) {
      refMap[Enums.pengGang] = this
      refMap.gang = this
      // }
    }
    return refMap
  }

  getGangKind(card, isSelf) {
    const c = this.cards[card]
    if (c === 3 && isSelf) {
      return 'anGang'
    }
    return 'mingGang'
  }

  markJiePao(card, map, ignore = false) {
    if (this.checkJiePao(card, ignore)) {
      const refMap = map
      if (refMap.hu) {
        refMap.hu.push(this)
      } else {
        refMap.hu = [this]
      }
    }
    return map
  }

  checkJiePao(card, ignore = false) {
    if (card === this.caiShen) return false


    this.cards.lastTakeCard = card
    this.turn = this.cards.turn = this.room.gameState.turn
    this.cards.takeSelfCard = false
    this.cards.first = this.turn === 2

    this.cards.alreadyTakenCard = this.alreadyTakenCard
    this.cards[card]++
    const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
    this.cards[card]--

    if (ignore && checkResult.hu) {
      return true
    }

    if (!this.rule.keJiePao) {
      return checkResult.fan > 1
    }

    return checkResult.hu && checkResult.fan > this.huForbidden

  }

  checkZiMo() {
    this.cards.lastTakeCard = this.lastCardToken
    this.turn = this.cards.turn = this.room.gameState.turn
    this.cards.takeSelfCard = true
    this.cards.qiaoXiang = this.hadQiaoXiang
    const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
    return checkResult.hu
  }

  onShuffle(remainCards, caiShen, juShu, cards, seatIndex, juIndex) {
    cards.forEach(x => {
      this.cards[x]++
    })
    this.caiShen = caiShen
    this.cards['caiShen'] = caiShen
    this.seatIndex = seatIndex

    this.recorder.recordUserEvent(this, 'shuffle')
    this.sendMessage('game/Shuffle', {juShu, cards, caiShen, remainCards, juIndex})
  }

  chiPai(card, otherCard1, otherCard2, daPlayer) {
    if (this.cards[otherCard1] > 0 && this.cards[otherCard2] > 0) {
      this.cards[otherCard1]--
      this.cards[otherCard2]--
      this.recordGameEvent(Enums.chi, [card, otherCard1, otherCard2])
      if (daPlayer) {
        daPlayer.consumeDropped()
      }
      this.emitter.emit('waitForDa')
      this.recordContact(daPlayer)
      this.record('chi', card)

      if (Math.abs(otherCard1 - otherCard2) === 2) {
        this.forbidCards = [card]
      } else {
        this.forbidCards = []
        const maxCard = Math.max(otherCard1, otherCard2)
        const minCard = Math.min(otherCard1, otherCard2)
        if (maxCard % 10 < 9) {
          this.forbidCards.push(maxCard + 1)
        }

        if (minCard % 10 > 1) {
          this.forbidCards.push(minCard - 1)
        }
      }

      this.alreadyTakenCard = true

      return true
    }
    return false
  }

  pengPai(card, daPlayer) {
    if (this.cards[card] >= 2) {
      this.cards[card] -= 2
      this.recordGameEvent(Enums.peng, card)
      if (daPlayer) {
        daPlayer.consumeDropped(card)
      }
      this.recordContact(daPlayer)
      this.record('peng', card)
      this.emitter.emit('waitForDa')
      this.alreadyTakenCard = true
      return true
    }
    return false
  }

  gangByPlayerDa(card: number, daPlayer: this) {
    if (this.cards[card] >= 3) {
      this.cards[card] -= 3
      this.recordGameEvent(Enums.mingGang, card)
      daPlayer.consumeDropped()
      daPlayer.recordGameEvent(Enums.dianGang, card)
      this.recordContact(daPlayer)
      this.record('gang', card)
      this.gangFrom.push(daPlayer)

      this.room.recordPlayerEvent('jieGang', this.model._id)
      this.room.recordPlayerEvent('fangGang', daPlayer.model._id)
      daPlayer.fangGangCount += 1
      return true
    }
    return false
  }

  gangBySelf(card, info_) {
    const info = info_
    if (this.events.peng && this.events.peng.contains(card)) {
      if (this.cards[card] === 1) {
        this.cards[card] = 0
        this.removeGameEvent(Enums.peng, card)
        this.recordGameEvent(Enums.mingGang, card)
        this.recordGameEvent(Enums.buGang, card)
        info.type = 1
        this.emitter.emit('recordMingGangSelf', card)
        this.room.recordPlayerEvent('buGang', this.model._id)
        this.record('gang', card)
        return true
      }
    } else {
      if (this.cards[card] === 4) {
        this.cards[card] = 0
        info.type = 3
        this.recordGameEvent(Enums.anGang, card)
        this.emitter.emit('recordAnGang', card)
        this.record('gang', card)
        this.room.recordPlayerEvent('anGang', this.model._id)
        return true
      }
    }
    return false
  }

  gangShangGang(card, self, info_) {
    const info = info_
    if (this.events.peng && this.events.peng.contains(card)) {
      if (this.cards[card] === 0) {
        this.removeGameEvent(Enums.peng, card)
        this.recordGameEvent(Enums.mingGang, card)
        info.type = 1
        return true
      }
    } else {
      if (this.cards[card] === 3) {
        this.cards[card] = 0
        if (self) {
          this.recordGameEvent(Enums.anGang, card)
          info.type = 3
        } else {
          this.recordGameEvent(Enums.mingGang, card)
          info.type = 2
        }
        return true
      }
    }
    return false
  }

  buBySelf(card, info) {
    return this.gangBySelf(card, info)
  }


  isTing() {
    let caiShen = this.caiShen

    this.cards.caiShen = caiShen
    this.cards[caiShen]++
    const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
    this.cards[caiShen]--

    return checkResult.hu
  }

  jiePao(card, first, haiDi, dianPaoPlayer) {
    this.cards[card]++
    this.cards.first = first
    this.cards.haiDi = haiDi
    this.cards.takeSelfCard = false
    this.cards.alreadyTakenCard = this.alreadyTakenCard
    const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
    this.cards[card]--


    if (checkResult.hu) {

      checkResult.zhuang = this.zhuang || dianPaoPlayer.zhuang
      this.recordGameEvent(Enums.jiePao, card)
      this.recordGameEvent(Enums.hu, checkResult)

      this.room.recordPlayerEvent(`fan${checkResult.fan}`, this.model._id)
      this.room.recordPlayerEvent('jiePao', this.model._id)
      this.room.recordPlayerEvent('dianPao', dianPaoPlayer.model._id)

      this.record('jiePao', card)
      return true
    }
    return false
  }

  zimo(card, first, haiDi) {
    if (this.cards[card] > 0) {
      this.cards.first = first
      this.cards.haiDi = haiDi
      this.cards.takeSelfCard = true
      this.cards.gang = this.gang
      this.cards.qiaoXiang = this.hadQiaoXiang
      this.cards.alreadyTakenCard = this.alreadyTakenCard

      const checkResult = HuPaiDetect.check(this.cards, this.events, this.rule, this.seatIndex)
      if (checkResult.hu) {
        checkResult.zhuang = this.zhuang

        this.recordGameEvent(Enums.hu, checkResult)
        this.recordGameEvent(Enums.zimo, card)
        this.emitter.emit('recordZiMo', checkResult)
        this.room.recordPlayerEvent('ziMo', this.model._id)
        this.room.recordPlayerEvent(`fan${checkResult.fan}`, this.model._id)

        this.record('ziMo', card)
        return true
      }
    }
    return false
  }

  daPai(card) {

    const forbidCards = this.forbidCards || []
    if (this.getCardsArray().length > 2) {
      if (forbidCards.indexOf(card) >= 0 && card !== this.freeCard) {
        return false
      }
    }

    if (this.cards[card] > 0) {
      this.cards[card]--
      this.dropped.push(card)
      this.lastDa = true
      this.pengForbidden = []
      this.huForbidden = 0
      this.forbidCards = []
      this.freeCard = Enums.slotNoCard

      this.emitter.emit('lastDa')
      this.record('da', card)
      return true
    }
    return false
  }

  on(event, callback) {
    this.emitter.on(event, callback)
  }

  listenDispatcher(playerSocket) {
    playerSocket.on('game/da', (msg) => {
      this.emitter.emit(Enums.da, msg.turn, msg.card)
    })
    playerSocket.on('game/qiaoXiang', (msg) => {

      this.emitter.emit('qiaoXiang', msg)
    })
    playerSocket.on('game/gangBySelf', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.gangBySelf, msg.turn, msg.card)
    })
    playerSocket.on('game/gangByOtherDa', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.gangByOtherDa, msg.turn, msg.card)
    })
    playerSocket.on('game/gangShangKaiHua', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangKaiHua', msg.turn)
    })
    playerSocket.on('game/gangShangPao', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangPao', msg.turn)
    })
    playerSocket.on('game/gangShangGuo', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangGuo', msg.turn)
    })
    playerSocket.on('game/gangShangKaiHuaGuo', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangKaiHuaGuo', msg.turn)
    })
    playerSocket.on('game/gangShangChi', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangChi', msg.turn, msg.card, msg.combol)
    })
    playerSocket.on('game/gangShangPeng', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangPeng', msg.turn, msg.card)
    })

    playerSocket.on('game/gangShangGang', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangGang', msg.turn, msg.card)
    })

    playerSocket.on('game/gangShangGangSelf', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangGangSelf', msg.turn, msg.card)
    })

    playerSocket.on('game/gangShangBu', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('gangShangBu', msg.turn, msg.card)
    })

    playerSocket.on('game/buBySelf', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.buBySelf, msg.turn, msg.card)
    })
    playerSocket.on('game/buByOtherDa', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('buByOtherDa', msg.turn, msg.card)
    })
    playerSocket.on('game/peng', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.peng, msg.turn, msg.card)
    })
    playerSocket.on('game/guo', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.guo, msg.turn, msg.card)
    })
    playerSocket.on('game/hu', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.hu, msg.turn, msg.card)
    })
    playerSocket.on('game/chi', (msg) => {
      this.cancelTimeout()
      this.emitter.emit(Enums.chi, msg.turn, msg.card, msg.combol[0], msg.combol[1])
    })
    playerSocket.on('game/yaoHaiDi', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('yaoHaiDi', msg.turn)
    })
    playerSocket.on('game/buYaoHaiDi', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('buYaoHaiDi', msg.turn)
    })
    playerSocket.on('game/haiDiLaoYue', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('haiDiLaoYue', msg.turn)
    })
    playerSocket.on('game/daHaiDi', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('daHaiDi', msg.turn)
    })
    playerSocket.on('game/haiDiJiePao', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('haiDiJiePao', msg.turn)
    })
    playerSocket.on('game/guoHaiDiPao', (msg) => {
      this.cancelTimeout()
      this.emitter.emit('guoHaiDiPao', msg.turn)
    })
    playerSocket.on('disconnect', this.disconnectCallBack)
    playerSocket.on('game/cancelDeposit', () => {
      this.onDeposit = false
      const cards = genCardArray(this.cards)
      this.cancelTimeout()
      this.sendMessage('game/cancelDeposit-ok', {cards})
    })
    playerSocket.on('game/refreshQuiet', () => {
      this.emitter.emit('refreshQuiet', playerSocket, this.seatIndex)
    })
  }


  checkQiaoXiang() {
    let caiCount = this.cards[this.caiShen]
    if (caiCount) {
      if (HuPaiDetect.checkQiaoXiang(this.cards)) {
        return true
      }
    }
    return false
  }


  mayCaiShenTou(card) {
    this.cards[card]++
    const pass = HuPaiDetect.mayCaiShenTou(this.cards)
    this.cards[card]--
    return pass
  }

  setQiaoXiang() {
    this.hadQiaoXiang = true
  }

  gameOver() {
    this.cancelTimeout()
    this.removeListeners()
  }

  removeListeners() {
    if (this.msgDispatcher) {
      Object.keys(this.msgDispatcher.getGameMsgHandler()).forEach(x => {
        this.msgDispatcher.removeAllListeners(x)
      })
      this.msgDispatcher.removeListener('disconnect', this.disconnectCallBack)
    }
  }

  recordGameEvent(key, info) {
    const oldTbl = this.events[key]
    if (oldTbl) {
      oldTbl.push(info)
    } else {
      this.events[key] = [info]
    }
    if (key === 'chi' || key === 'peng' || key === 'mingGang' || key === 'anGang') {
      if (this.events.chiPengGang) {
        this.events.chiPengGang.push([key, info])
      } else {
        this.events.chiPengGang = [[key, info]]
      }
    }
  }

  removeGameEvent(key, info) {
    if (this.events[key]) {
      this.events[key].remove(info)
    }
    if (key === 'chi' || key === 'peng' || key === 'mingGang' || key === 'anGang') {
      if (this.events.chiPengGang) {
        this.events.chiPengGang.removeFilter(x => x[0] === key && x[1] === info)
      }
    }
  }

  consumeDropped() {
    this.dropped.splice(this.dropped.length - 1, 1)
    this.lastDa = false
  }

  clearLastDaFlag() {
    this.lastDa = false
  }

  sendMessage(name, data) {
    if (this.msgHook[name]) {
      this.msgHook[name](data)
    }

    if (name == 'game/canDoSomething') {
      this.lastOptions = data
    }

    if (!this.lockMsg && this.msgDispatcher) {
      this.msgDispatcher.sendMessage(name, data)
    }
    return data
  }

  lockMessage() {
    this.lockMsg = true
  }

  unlockMessage() {
    this.lockMsg = false
  }

  winScore(diFen: number = 1): number {
    let score = 0

    if (this.events[Enums.jiePao]) {
      let result = this.events.hu[0]
      let base = result.fan === 1 ? 1 : 3
      score = result.fan * base
    }

    if (this.events[Enums.zimo]) {
      let result = this.events.hu[0]

      score = 2 * result.fan
      return score
    }

    return score * diFen
  }


  genGameStatus(index, score_fan = 1) {
    const specialTimes = i => i


    const cards = []
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i]
      for (let j = 0; j < c; j++) {
        cards.push(i)
      }
    }

    let score = 0

    const oppoCount = (this.rule.playerCount - 1)

    if (this.events[Enums.zimo]) {
      this.events.hu.forEach(
        result => {
          score += 2 * oppoCount * result.fan
        }
      )
    }

    if (this.events[Enums.taJiaZiMo]) {
      this.events[Enums.taJiaZiMo].forEach(result => {
        score -= 2 * result.fan
      })
    }
    if (this.events[Enums.jiePao]) {
      this.events.hu.forEach(
        result => {
          let base = result.fan === 1 ? 1 : 3
          let singleScore = result.fan * base
          score += singleScore
        })
    }

    if (this.events[Enums.dianPao]) {
      this.events[Enums.dianPao].forEach(result => {

        let base = result.fan === 1 ? 1 : 3
        score -= result.fan * base
      })
    }

    if (this.events[Enums.hunhun]) {
      this.events.hunhun.forEach(
        result => {
          score = 0 //score_fan * result.fan
        }
      )
    }
    // if (!this.events[Enums.dianPao] && !this.events[Enums.jiePao]) {
    //   console.log("player_state.js genGameStatus 862",this.events)
    //   score -= calFan(result, false, result.zhuang) * score_fan;
    // }


    if (this.events.hu) {
      let hu = Array.prototype.slice.call(this.events.hu)[0]
      if (hu.baoTou || hu.qiDuiZiBaoTou || hu.gangBao || hu.gangShangKaiHua || hu.haiDiLaoYue) {
        // delete this.events.zimo
      }
    }
    return {
      index,
      score,
      cards,
      niaoCount: this.niaoCount,
      jieGangCount: this.gangFrom.length,
      anGangCount: this.eventCount('anGang'),
      buGangCount: this.eventCount('buGang'),
      fangGangCount: this.fangGangCount,
      events: this.events,
      model: this.model,
    }
  }

  eventCount(eventName: string): number {
    if (this.events[eventName]) {
      return this.events[eventName].length
    }
    return 0
  }


  genSelfStates(index) {
    const cards = []
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i]
      for (let j = 0; j < c; j++) {
        cards.push(i)
      }
    }
    return {
      index,
      cards,
      tingPai: this.tingPai,
      locked: this.locked,
      dropped: this.dropped,
      events: this.events,
      model: this.model,
      ip: this.ip,
      lastDa: this.lastDa,
      score: this.score,
      base: this.room.currentBase,
      caiShen: this.caiShen,
      rule: this.rule,
      room: this.room._id
    }
  }

  genOppoStates(index) {
    const cardCount = HuPaiDetect.remain(this.cards)
    return {
      index,
      cardCount,
      tingPai: this.tingPai,
      locked: this.locked,
      events: this.events,
      model: this.model,
      dropped: this.dropped,
      lastDa: this.lastDa,
      ip: this.ip,
      score: this.score,
      base: this.room.currentBase,
      caiShen: this.caiShen,
      rule: this.rule,
      room: this.room._id
    }
  }

  isHu() {
    return this.events.hu != null
  }

  onDisconnect() {
    // this.onDeposit = true;
    this.removeListeners()
    //this.msgDispatcher = null;
  }

  reconnect(msgDispatcher) {
    this.msgDispatcher = msgDispatcher
    this.onDeposit = false
    this.listenDispatcher(msgDispatcher)
  }

  deposit(callback) {
    const minutes = 20 * 1000

    if (!this.room.isPublic) {
      return
    }

    if (!this.msgDispatcher) {
      return
    }
    this.cancelTimeout()
    if (!this.onDeposit) {
      this.timeoutTask = setTimeout(() => {
        this.onDeposit = true
        this.sendMessage('game/startDeposit', {})
        callback()
        this.timeoutTask = null
      }, minutes)
    } else {
      let isRobot = this.msgDispatcher.isRobot()

      this.timeoutTask = setTimeout(() => {
        callback()
        this.timeoutTask = null
      }, isRobot ? random(500, 1500) : 1000)
    }
  }

  cancelTimeout() {
    if (this.timeoutTask != null) {
      clearTimeout(this.timeoutTask)
      this.timeoutTask = null
    }
  }

  registerHook(name, callback) {
    this.msgHook[name] = callback
  }

  deleteHook(name) {
    delete this.msgHook[name]
  }

  getDianPaoNum() {
    const dp = this.events[Enums.dianPao]
    if (!dp) {
      return 0
    }
    return dp.length
  }

  huPai() {
    return this.events.hu != null
  }

  suoPai() {
    this.locked = true
  }

  getCardsArray() {
    const cards = []
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i]
      for (let j = 0; j < c; j++) {
        cards.push(i)
      }
    }
    return cards
  }

  isForbidForGang(card: number) {
    return this.gangForbid.indexOf(card) >= 0
  }

  getAvailableGangs() {
    let gangs = []
    for (let pengCard of this.events.peng || []) {
      if (this.cards[pengCard] > 0 && !this.isForbidForGang(pengCard)) {
        gangs.push([pengCard, 'mingGang'])
      }
    }

    for (let card = 1; card <= Enums.bai; card++) {
      if (this.cards[card] === 4) {
        gangs.push([card, 'anGang'])
      }
    }
    return gangs
  }

  requestAction(action: string, ...params) {
    this.emitter.emit(action, ...params)
  }

  winFrom(loser: this, score) {

    this.balance += (loser.niaoCount + 1) * score

    loser.balance -= score * (1 + this.niaoCount)

    this.buyer.balance += (this.niaoCount - loser.niaoCount) * score
  }
}

export default PlayerState
