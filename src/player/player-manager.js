/**
 * Created by user on 2016-07-02.
 */
import * as logger from 'winston';

import Player from './player';
import PlayerModel from '../database/models/player';

let instance = null;

class PlayerManager {
  static getInstance() {
    if (!instance) {
      instance = new PlayerManager();
    }

    return instance;
  }

  // for test
  static destroyInstance() {
    instance = null;
  }

  constructor() {
    this.players = {};
    this.loggingInPlayers = {};
  }

  onConnect(socket) {
    if (socket.player) {
      logger.info(`重复的连接事件: ${socket.player.unionid}, ${socket.player.nickname}`);
      return null;
    }

    return new Player(socket);
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

    if (!player.model.unionid) {
      logger.warn(`玩家未登录: ${player}`);
      return false;
    }

    if (this.players[player.model.unionid]) {
      logger.warn(`重复的玩家ID: ${player.model.unionid}, ${player.model.nickname}`);
      return false;
    }

    this.players[player.model.unionid] = player.model;
    player.once('disconnect', () => {
      if (this.players[player.model.unionid] === player.model) {
        this.removePlayer(player.model.unionid);
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

  onLinePlayers() {
    return Object.keys(this.players).length
  }

  async addGold(playerId, gold) {
    const player = this.getPlayer(playerId)
    if (player) {
      let totalGold = player.model.gold;
      totalGold += gold;
      player.model.gold = totalGold;
    }
    await PlayerModel.update({_id: playerId}, {$inc: {gold}});
    await player.updateResource2Client()
  }

  async addRuby(playerId, ruby) {
    const player = this.getPlayer(playerId)
    let delta = ruby
    if (player) {
      let newRuby = player.model.ruby + ruby;
      if (newRuby < 0) {
        newRuby = 0
        delta = -player.model.ruby
      }
      player.model.ruby = newRuby
    }

    await PlayerModel.update({_id: playerId}, {$inc: {ruby: delta}});
    await player.updateResource2Client()
  }

  async addGem(playerId, gem) {
    const player = this.getPlayer(playerId)
    if (player) {
      let totalGem = player.model.gem;
      totalGem += gem;
      player.model.gem = totalGem;
    }
    await PlayerModel.update({_id: playerId}, {$inc: {gem}});
    await player.updateResource2Client();
  }


}

export default PlayerManager;
