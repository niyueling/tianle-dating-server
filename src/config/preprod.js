module.exports = {
  database: {
    url: "mongodb://localhost:27017/mahjong"
  },
  redis: {
    port: 6379,
    host: "localhost",
  },
  websocket: {
    port: 9529
  },
  logger: {
    "filename": "mahjong.log"
  },
  debug: {
    message: true
  },
  jwt: {
    // 密钥
    secret: 'D5M8sf:!,yXa-b13',
  },
  // 大厅服 http 端口
  http: {
    port: 3002
  },
  "gmTool": {
    port: 9528,
    "superAccounts": [
      {
        "username": "super",
        "password": "super"
      }
    ],
    server: {
      "api": "http://localhost:3002"
    },
    allowOrigin: [
      "http://106.14.169.25:3003"
    ]
  }
}
