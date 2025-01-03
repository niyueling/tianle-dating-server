module.exports = {
  database: {
    // 游戏服中的 mongo
    url: "mongodb://172.19.148.251:27017/tianleServer"
  },
  websocket: {
    "port": 9595
  },
  logger: {
    "filename": "mahjong.log"
  },
  debug: {
    "message": false
  },
    rabbitmq: {
        url: "amqp://user:password@localhost:5693"
    },
  redis: {
    port: 8399,
    host: "172.19.148.251",
    password: "8fkaetmR@@@@"
  },
  http: {
    port: 4002,
  },
  jwt: {
    // 密钥
    secret: 'tv+-u:JV>cWG|K8H',
  }
}
