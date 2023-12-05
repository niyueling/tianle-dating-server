/**
 * Created by user on 2016-07-05.
 */
import IDGenerator from './id-generator';
import Room, {PublicRoom} from './room';
import Game from './game';
import Enums from '../match/mj_hunan/enums';

function createRoom(self, id, rule) {

  let room
  if (rule.isPublic) {
    room = new PublicRoom(rule);
  } else {
    room = new Room(rule);
  }
  room._id = id;
  self.rooms.set(id, room);
  self.listenRoom(room, id);
  return room;
}

let instance = null;

class Lobby {
  static getInstance() {
    if (!instance) {
      instance = new Lobby();
    }
    return instance;
  }

  static destroyInstance() {
    if (instance) {
      instance = null;
    }
  }

  constructor() {
    this.rooms = new Map();
    this.idGenerator = new IDGenerator(999999, 2000);
    this.playerRoomTable = new Map();
  }

  getAvailableRoom(playerId, ruleMessage = {}) {
    const {keJiePao = true, diFen = 5} = ruleMessage

    let found = null;
    for (const kv of this.rooms) {
      const room = kv[1];
      if (!room.isFull() &&
        room.isPublic &&
        room.game.rule.keJiePao === keJiePao &&
        room.game.rule.diFen === diFen
      ) {
        found = room;
        break;
      }
    }
    if (found) {
      return found;
    }
    const ret = this.createRoom(true, {
      keJiePao, diFen,
      useCaiShen: false,
      isPublic: true,
      feiNiao: 0
    });
    ret.ownerId = playerId;
    ret.creator = {model: {_id: 'systemCreator'}}
    return ret;
  }

  getRoom(id) {
    if (id) {
      const room = this.rooms.get(id);
      return room;
    }

    return null;
  }

  createRoom(isPublic = false, rule = {}) {
    const id = this.idGenerator.getRandom();
    let newRule = Object.assign({}, rule, {isPublic})
    const room = createRoom(this, id, newRule);
    return room;
  }

  listenRoom(room, id) {
    room.on('disconnect', (playerId) => {
      console.log('player disconnect', playerId);
      this.playerRoomTable.set(playerId, room);
    });
    room.on('empty', (readyPlayers) => {
      this.idGenerator.put(id);
      this.rooms.delete(id);
      readyPlayers.forEach(x => this.playerRoomTable.delete(x));
    });
    room.on('reconnect', (player) => {
      this.playerRoomTable.delete(player._id);
    });
  }

  clearDisConnectedPlayer(playerId) {
    this.playerRoomTable.delete(playerId);
  }

  hasRoom(id) {
    return Boolean(this.rooms.get(id));
  }

  getDisconnectedRoom(playerId) {
    const r = this.playerRoomTable.get(playerId);
    if (r) {
      console.log('reconnect room :', playerId);
      return r;
    }
    return null;
  }

  openingRooms() {
    return this.rooms.size
  }
}

export default Lobby;
