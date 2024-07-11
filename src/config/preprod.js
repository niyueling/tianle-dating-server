module.exports = {
  database: {
    url: "mongodb://localhost:27017/tianleServer"
  },
  redis: {
    port: 8389,
    host: "localhost",
    password: "8fkaetmR@@@@"
  },
  websocket: {
    port: 9599
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
    port: 4002
  },
}
