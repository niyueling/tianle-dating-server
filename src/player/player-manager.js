/**
 * Created by user on 2016-07-02.
 */
import * as winston from 'winston';

import Player from './player';

let instance = null;

let connection = null
const transports = process.env.NODE_ENV === 'test' ? [] : [new winston.transports.Console()]
const logger = new winston.Logger({transports})

class PlayerManager {
  static getInstance() {
    if (!instance) {
      instance = new PlayerManager();
    }

    return instance;
  }

  static injectRmqConnection(rmqConnection) {
    connection = rmqConnection;
    console.warn(connection);
  }

  // for test
  static destroyInstance() {
    instance = null;
  }

  constructor() {
    // 在线人数
    this._onlinePlayers = 0;
    this.players = {};
    this.loggingInPlayers = {};
  }

  onConnect(socket) {
    if (socket.player) {
      logger.info(`重复的连接事件: ${socket.player._id}, ${socket.player.name}`);
      return null;
    }
    // 在线人数 + 1
    this._onlinePlayers++;
    return new Player(socket, connection)
  }

  addLoggingInPlayer(_id) {
    this.loggingInPlayers[_id] = true;
  }

  removeLoggingInPlayer(_id) {
    delete this.loggingInPlayers[_id];
  }

  isLoggingIn(_id) {
    return !!(this.loggingInPlayers[_id]);
  }

  addPlayer(player) {
    if (!player) {
      return false;
    }

    if (!player._id) {
      logger.warn(`玩家未登录: ${player}`);
      return false;
    }

    if (this.players[player._id]) {
      logger.warn(`重复的玩家ID: ${player._id}, ${player.name}`);
      return false;
    }

    this.players[player._id] = player;
    player.once('disconnect', () => {
      if (this.players[player._id] === player) {
        this.removePlayer(player._id);
      }
    });

    return true;
  }

  removePlayer(id) {
    delete this.players[id];
  }

  getPlayer(id) {
    return this.players[id];
  }

  onDisconnect(socket) {
    const player = socket.player;
    if (!player) {
      logger.error(`Player not found when disconnecting: ${socket && socket.id}`);
      return;
    }
    // 在线人数--
    this._onlinePlayers--;
    player.onDisconnect();
  }

  onMessage(socket, data) {
    const player = socket.player;
    if (!player) {
      logger.error(`Player not found when receiving message: ${socket && socket.id}`);
      return;
    }

    player.onMessage(data);
  }

  notice(message) {
    for (const key of Object.keys(this.players)) {
      this.players[key].sendMessage('global/notice', message);
    }
  }

  get onLinePlayers() {
    return this._onlinePlayers
  }
}

export default PlayerManager;
