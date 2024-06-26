// 内网虚拟机配置
module.exports = {
  database: {
    url: "mongodb://localhost:27017/tianleServer",
    // mongo 选项
    opt: {
      // 重连间隔5s
      reconnectInterval: 5000,
      // 60
      connectTimeoutMS: 60000,
    }
  },
  redis: {
    port: 8389,
    host: "localhost",
    password: "8fkaetmR@@@@"
  },
  extKey: "0a06ae02-5594-40ec-9979-a278c0f7ae66",
  // 大厅服 http 端口
  http: {
    port: 4002
  },
  websocket: {
    port: 9599
  },
  wechat: {
    pk: '/home/lblue/cert/apiclient_key.pem',
    pfxPath: '/home/lblue/cert/apiclient_cert.p12',
    certPath: '/home/lblue/cert/platform-cert',
  },
  gmTool: {
    port: 9528,
    jwt: {
      "secret": "secret"
    },
    superAccounts: [
      {
        "username": "super",
        "password": "super"
      }
    ],
    "recharge": {
      "kickback": 0.25,
      "kickback2": 0.2
    },
    "server": {
      "api": "http://localhost:3001"
    },
    allowOrigin: [
      "http://192.168.124.20:3003",
    ]
  },
  "logger": {
    "level": "debug"
  },
  "debug": {
    "message": true
  },
  game: {
    debug: false,
    adminNotifyUrl: 'http://192.168.124.30:8000/adminapi/user.User/registNotify',
  },
  club: {
    // 昨日最少开局数
    minYesterdayGameCounter: 0,
  }
}
