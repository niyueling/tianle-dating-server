/**
 * Created by user on 2016-07-03.
 */

import PlayerManager from '../player/player-manager';

function onDisconnect(socket) {
  PlayerManager.getInstance().onDisconnect(socket);
}

function onMessage(socket, data) {
  PlayerManager.getInstance().onMessage(socket, data);
}

function onConnect(socket, req) {
  function ping() {
    socket.send('ping', function () {
    })
  }

  socket.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress

  let lastPong = Date.now()
  let interval = setInterval(() => {
    ping()
    if (Date.now() - lastPong > 30000) {
      clearInterval(interval)
      socket.close()
    }
  }, 1000)

  socket.on('close', () => {
    clearInterval(interval)
    onDisconnect(socket)
  });
  socket.on('message', (data) => {
    if (data === 'pong') {
      lastPong = Date.now()
      return
    }
    onMessage(socket, data)
  });
  socket.on('error', (error) => {
    console.log(`${__filename}:19 `, error);
  })

  PlayerManager.getInstance().onConnect(socket);
}

export default {
  onConnect,
  onDisconnect,
  onMessage,
};

