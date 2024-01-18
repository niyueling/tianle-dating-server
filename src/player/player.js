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
import {GameError} from "@fm/common/errors";
import {Region} from "./message-handlers/region";
import {service} from "../service/importService";
import {GoodsApi} from "./message-handlers/goodsApi";
import {AccountApi} from "./message-handlers/accountApi";
import {verifyWithRecord} from "../utils/jwt";
import {InviteApi} from "./message-handlers/inviteApi";
import {LotteryApi} from "./message-handlers/lotteryApi";
import {GameApi} from "./message-handlers/gameApi";
import {BattleBlockApi} from "./message-handlers/battleBlockApi";
import {TurnTableApi} from "./message-handlers/TurnTableApi";
import {MockDataApi} from "./message-handlers/mockDataApi";
import {TianleErrorCode} from "@fm/common/constants";

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
  battleBlock: BattleBlockApi,
  turnTable: TurnTableApi,
  mockData: MockDataApi
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

Object.assign(messageHandlers,
    accountHandlers,
    matchHandlers,
    resourceHandlers,
    gameHandlers,
    socialHandlers,
    chatHandlers,
    mailHandlers,
    errorHandlers,
);

class Player extends EventEmitter {
  constructor(socket) {
    super();
    const s = socket;
    this.isDone = false;
    s.player = this;
    this.socket = socket;
    this.sendCallback = (err) => {
      if (err) {
        logger.warn(err);
      }
    };
    this.debugMessage = config.debug.message || false;
    // TODO 查找位置
    this.location = '未知';
  }

  getDebugMessage(data) {
    let content = data;
    if (content.length > 512) {
      content = `${content.slice(0, 512)}...`;
    }

    return content;
  }

  async getLocation(ip) {
    if (!ip) {
      ip = this.getIpAddress();
    }
    const res = await service.base.curl(`https://ipcity.market.alicloudapi.com/ip/city/query?ip=${ip}`, {
      method: "get",
      headers: {
        Authorization: "APPCODE " + config.ipConfig.appCode
      }
    });

    // console.error(res);
    return JSON.parse(res.data);
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
      if (this.debugMessage) {
        logger.debug(`Player: [${this._id}, ${this.name}] receive ${data}`);
      }
      console.log(data)
      const packet = deserializeMessage(data);
      // 记录日志
      logger.info('get message from', packet.name, packet.message);
      // 检查 token
      isTokenValid(packet.name, packet.token, this).then(isOk => {
        if (!isOk) {
          logger.error(`invalid token for ${packet.name} ${packet.token}`);
          return this.sendMessage('global/invalidToken', {ok: false, info: TianleErrorCode.tokenInvalid});
        }
        const handler = messageHandlers[packet.name];
        if (handler) {
          return handler(this, packet.message);
        }
        // 调用新接口函数
        const req = packet.name.split('/');
        if (req.length === 2 && apiClass[req[0]]) {
          return invokeApi(req[0], req[1], packet, this);
        }
        logger.error(`未知的消息：${JSON.stringify(packet)}`);
      });
    } catch (e) {
      logger.error(e);
    }

    return false;
  }

  get _id() {
    return this.model && this.model._id;
  }

  get id() {
    if (!this.model) {
      throw new GameError('请先登录');
    }
    return this.model._id;
  }

  get name() {
    return this.model && this.model.name;
  }

  get gold() {
    return (this.model && this.model.gold) || 0;
  }

  get gem() {
    return (this.model && this.model.diamond) || 0;
  }

  get ruby() {
    return (this.model && this.model.ruby) || 0;
  }

  addGold(gold) {
    if (this.model) {
      let totalGold = this.model.gold;
      totalGold += gold;
      this.model.gold = totalGold;
      this.sendMessage('resources/updateGold', {gold: totalGold});
      PlayerModel.update({_id: this.model._id}, {$inc: {gold: gold}},
        (err) => {
          if (err) {
            logger.error(err);
          }
        });
    }
  }

  async addRuby(ruby) {
    if (this.model) {
      let newRuby = this.model.gold + ruby;
      let delta = ruby
      if (newRuby < 0) {
        delta = -this.model.gold
        this.model.gold = 0;
      } else {
        this.model.gold = newRuby
      }
      await PlayerModel.update({_id: this.model._id}, {$inc: {gold: delta}});
      await this.updateResource2Client();
    }
  }

  async addGem(gem) {
    if (this.model) {
      let totalGold = this.model.gem;
      totalGold += gem;
      this.model.gem = totalGold;
      this.sendMessage('resources/updateGold', {gem: totalGold});
      PlayerModel.update({_id: this.model._id}, {$inc: {gem: gold}},
        (err) => {
          if (err) {
            logger.error(err);
          }
        });
    }
  }


  onDisconnect() {
    this.emit('disconnect', this);
    this.socket.player = null;
    this.socket = null;
    logger.info(`Player [${this._id}, ${this.name}] disconnected`);
  }

  async disconnect() {
    this.isDone = true;
    logger.info(`Disconnect player: ${this._id}`);
    if (this.socket) {
      const promise = new Promise((resolve) => {
        this.once('disconnect', () => resolve());
      });
      this.socket.close();
      this.socket.terminate();
      await promise;
    }
  }

  sendMessage(name, message) {
    try {
      const packet = {name, message};
      const data = serializeMessage(packet);
      logger.info(`Player: [${this._id}, ${this.name}] send ${data}`);

      if (this.socket && this.socket.readyState === ws.OPEN) {
        this.socket.send(data, this.sendCallback);
      }
    } catch (e) {
      logger.error(e);
    }
  }

  async updateResource2Client() {
    if (!this.model) {
      return;
    }
    const model = await service.playerService.getPlayerModel(this.model._id);
    this.sendMessage('resource/update', pick(model, ['gold', 'diamond']))
  }

  getGameMsgHandler() {
    return gameHandlers;
  }

  isRobot() {
    return false;
  }
}

export default Player;
