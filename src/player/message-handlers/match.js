/**
 * Created by user on 2016-07-05.
 */

import Lobby from '../../match/lobby';
import Room from '../../match/room';

function checkRoom(player, room) {
  if (!room) {
    player.sendMessage('room/join-fail', {reason: '此房间不存在, 请重新输入房间号'});
    return false;
  }

  if (room.isFull(player)) {
    player.sendMessage('room/join-fail', {reason: '房间人数已满, 请重新输入房间号'});
    return false;
  }

  console.log("match.js 19 checkRoom", room.game.rule.ro.difen);
  console.log('player', player.model)

  // let lowestMultiplier = room.lowestMultiplier()
  // let difen = room.difen()

  // if (difen * lowestMultiplier > player.model.gold) {
  //   player.sendMessage('room/join-fail', {reason: `金豆数小于${lowestMultiplier}倍底分,\n请充值`})
  //   return false
  // }


  if (room.game.rule.share) {
    if (player.model.gem <= 0) {
      player.sendMessage('room/join-fail', {reason: '钻石不足 无法加入房间。'});
      return
    }
  }


  if (!room.canJoin(player)) {
    player.sendMessage('room/join-fail', {reason: '房间人数已满! 请重新输入房间号.'});
    return false;
  }

  return true;
}

const handlers = {
  'room/reconnect': (player, message) => {
    const room = Lobby.getInstance().getDisconnectedRoom(player._id);
    if (room) {
      player.sendMessage('room/reconnectReply', {errorCode: 0, _id: room._id, rule: room.rule});
      return room.reconnect(player);
    }
    player.sendMessage('room/reconnectReply', {errorCode: 1});
    return false;
  },
  'room/join-lobby': (player, message) => {
    const lowestLimit = Room.publicRoomLowestLimit(message.rule)

    if (player.ruby <= lowestLimit) {
      return player.sendMessage('room/join-fail', {reason: `钻石不足${lowestLimit + 1} 请先兑换`})
    }

    const room = Lobby.getInstance().getAvailableRoom(player._id, message.rule);
    if (!checkRoom(player, room)) {
      return false;
    }
    player.sendMessage('room/join-success', {_id: room._id, rule: room.rule});
    return room.join(player);
  },

  'room/join-friend': (player, message) => {
    const room = Lobby.getInstance().getRoom(message._id);
    if (!checkRoom(player, room)) {
      return false;
    }

    player.sendMessage('room/join-success', {_id: room._id, rule: room.rule});
    return room.join(player);
  },

  'room/create': (player, message) => {
    let room;

    let juShu = message.rule.juShu

    let needGem = 3

    if (message.rule.juShu === 4) {
      needGem = 1
    } else if (message.rule.juShu === 8) {
      needGem = 2
    } else {
      needGem = 3
    }


    if (player.gem < needGem) {
      return player.sendMessage('room/join-fail', {reason: `钻石不足 无法创建`})
    }

    if (message.rule.useCaiShen) {
      message.rule.kehu = []
    } else {
      message.rule.kehu = [
        'qingYiSe', 'haoQi', 'pengPenghu', 'tianHu', 'diHu'
      ]
    }

    room = Lobby.getInstance().createRoom(false, message.rule);
    room.ownerId = player._id;
    if (!checkRoom(player, room)) {
      room.emit('empty', [])
      return false;
    }

    room.creator = player;
    player.sendMessage('room/join-success', {_id: room._id, rule: room.rule});
    if (room) {
      const join = room.join(player);
      //room.ready(player)
      return join
    } else {
      return false;
    }
  },

  'room/next-game': (player) => {
    console.log('player ', [player._id, player.name], 'request next game');
    if (!player.room) {
      player.sendMessage('room/join-fail', {reason: '你已经离开了房间!'})
      return false;
    }
    return player.room.nextGame(player);
  },
  'room/leave': (player) => {
    if (!player.room) {
      return false;
    }

    const room = player.room;
    if (player.room.leave(player)) {
      player.sendMessage('room/leave-success', {_id: room._id});
      return true;
    }

    player.sendMessage('room/leave-fail', {_id: room._id});
    return false;
  },

  'room/ready': (player) => {
    if (!player.room) {
      return false;
    }

    const room = player.room;
    room.ready(player);
    return true;
  },
  'room/unReady': (player) => {
    if (!player.room) {
      return false;
    }
    const room = player.room;
    const ok = room.unReady(player);
    player.sendMessage('room/unReadyReply', {ok});
    return ok;
  },
  'room/sound-chat': (player, m) => {
    const message = m;
    if (!player.room) {
      return false;
    }

    const room = player.room;
    const index = room.getPlayers().indexOf(player);
    message.index = index;
    room.broadcast('room/sound-chat', message);
    return true;
  },

  'room/buildInChat': (player, msg) => {
    const message = msg;
    if (!player.room) {
      return false;
    }

    const room = player.room;
    const index = room.getPlayers().indexOf(player);
    message.index = index;
    room.broadcast('room/buildInChat', message);
    return true;
  },

  'room/startRobotGame': (player, msg) => {
    if (!player.room) {
      return false;
    }
    player.room.startWithRobot(player);
    return true;
  },

  'room/dissolve': (player) => {
    if (!player.room) {
      return false;
    }
    return player.room.dissolve(player);
  },

  'room/dissolveReq': (player) => {
    if (!player.room) {
      return false;
    }
    player.room.onRequestDissolve(player);
  },
  'room/AgreeDissolveReq': (player) => {
    if (!player.room) {
      return false;
    }
    player.room.onAgreeDissolve(player);
  },
  'room/DisagreeDissolveReq': (player) => {
    if (!player.room) {
      return false;
    }
    player.room.onDisAgreeDissolve(player);
  },
  'room/updatePosition': (player, {position}) => {
    if (!player.room) {
      return false;
    }

    const room = player.room
    if (position) {
      player.model.position = position
      const positions = room.players.map(p => p && p.model)
      room.broadcast('room/playersPosition', {positions});
      return true;
    }
  }
};

export default handlers;
