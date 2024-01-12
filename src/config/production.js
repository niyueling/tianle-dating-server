module.exports = {
  database: {
    // 游戏服中的 mongo
    url: "mongodb://172.19.148.251:27017/mahjong"
  },
  websocket: {
    "port": 9527
  },
  logger: {
    "filename": "mahjong.log"
  },
  debug: {
    "message": false
  },
  // 游戏服中的 redis
  redis: {
    port: 6379,
    host: "172.19.148.251",
    password: "8fkaetmR@@@@"
  },
  http: {
    port: 4001,
  },
  jwt: {
    // 密钥
    secret: 'tv+-u:JV>cWG|K8H',
  },
  gmTool: {
    port: 9528,
    superAccounts: [
      {
        "username": "super",
        "password": "qq42833131"
      }
    ],
    allowOrigin: [
      "https://admin.tianle.fanmengonline.com",
      "http://admin.tianle.fanmengonline.com",
    ],
    server: {
      api: "http://localhost:3001"
    },
  }
}
