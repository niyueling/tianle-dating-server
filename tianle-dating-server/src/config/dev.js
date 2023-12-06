module.exports = {
  database: {
    url: "mongodb://192.168.124.20:27017/mahjongStage",
    opt: {
      // useNewUrlParser: true,
      reconnectTries: 99,
      "reconnectInterval": 5000,
      "connectTimeoutMS": 60000
    }
  },
  redis: {
    port: 6379,
    host: "localhost",
  },
  jwt: {
    secret: 'secret',
    // 有效期 30天
    expiresIn: 31*24*60*60,
    // 不需要 token 的接口
    needNotToken: [ 'account/login', 'account/getWechatUserInfo', 'account/getSMSCode', 'account/loginByAppleId']
  },
  extKey: "0a06ae02-5594-40ec-9979-a278c0f7ae66",
  http: {
    "port": 4002
  },
  websocket: {
    "port": 9599
  },
  // 微信支付配置
  wechat: {
    // 微信支付 appid
    appId: 'wxe1a7858e201773c9',
    secret: '40ef04587f65bc7a074bba051ef3971d',
    // 商户号 id
    mchId: '1632720964',
    // app微信支付
    appPayAppId: '',
    appPaySecret: '',
    // 小程序 appid
    quickAppId: 'wxb5e48d0993c3a40c',
    quickSecret: '7b5fb7ef42de397e4e1c3933542abf18',
    // 公众号 appid
    publicAppId: 'wx3aa4469700ec07f5',
    publicSecret: '48edc3bc870bbc4f71ffad70c5b3fd13',
    // 接收支付通知的链接
    notifyUrl: 'https://pay.tianle.fanmengonline.com/wechat/notify',
    // 商户证书序列号
    serialNo: '5D9A17286800617024A05A88C9DCACD12298D8F2',
    // v2版密钥
    apiV2Secret: 'YdrTlPqPXYqhOwWGaXKsqum6ZrKzKRG1',
    // v3版
    apiV3Secret: 'YdrTlPqPXYqhOwWGaXKsqum6ZrKzKRG1',
    // 商户API私钥路径
    pk: '/root/cert/apiclient_key.pem',
    // 私钥内容
    pkContent: null,
    // 商户API证书路径
    // https://kf.qq.com/faq/161222NneAJf161222U7fARv.html
    pfxPath: '/root/cert/apiclient_cert.p12',
    // 证书内容
    pfxContent: null,
    // 腾讯平台证书保存目录(绝对路径, 默认上级目录 cert)
    certPath: '/root/cert/platform-cert',
    // 腾讯平台证书内容
    wechatCert: {},
  },
  apple: {
    // app name
    bundleId: 'game.tianle.majiang',
  },
  wx: {
    "app_id": "wxe1a7858e201773c9",
    "app_secret": "40ef04587f65bc7a074bba051ef3971d",
    "mchId": "1632720964",
    "serial_no": "5D9A17286800617024A05A88C9DCACD12298D8F2",
    "token": "ulong_wechat",
    "notify_url": "http://ext1.fanmengonline.com/wechat/notify",
    "notify_url_gm": "http://ext1.fanmengonline.com/wechat/gm/notify",
    "sign_key": "YdrTlPqPXYqhOwWGaXKsqum6ZrKzKRG1",
    "plans": [
      {
        "gem": 22,
        "price": 20
      },
      {
        "gem": 56,
        "price": 50
      },
      {
        "gem": 114,
        "price": 100
      },
      {
        "gem": 236,
        "price": 200
      },
      {
        "gem": 620,
        "price": 500
      },
      {
        "gem": 1428,
        "price": 1000
      }
    ],
    "gmPlans": [
      {
        "price": 0.01,
        "gem": 1
      }
    ],
    // 微信登录用
    login: {
      appId: 'wxd168e488f38094e2',
      secret: '0c2810d1b18de1368a8397f99b91d045',
    },
  },
  gmTool: {
    // gm 后台 express 端口
    "port": 9528,
    "jwt": {
      "secret": "secret"
    },
    "superAccounts": [
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
    "allowOrigin": [
      "http://localhost:3003",
      "http://admin.xiexiangwangluo.com",
      "http://admin.yamatett.com",
      "http://admin1.tykym.com",
      "http://admin1.181818jh.com"
    ]
  },
  "logger": {
    "level": "debug"
  },
  "debug": {
    "message": true
  },
  game: {
    "initModelGoldCount": 0,
    "luckyDrawNeedGold": 500,
    "lobbyFee": 1000,
    "createRoomNeedGem": 1,
    "createRoomNeedGold": 0,
    "initModelGemCount": 6,
    "gem2GoldExchangeRate": 5000,
    // 初始金豆数量
    initModelRuby: 50000,
    // 排行榜抽奖宝箱数量
    rankBoxCount: 45,
    "prizeNeedRoomNum": 5,
    "prizeCount": 11,
    "prizeIndex2Prize": [
      {
        "type": "again",
        "count": 1
      },
      {
        "type": "gold",
        "count": 3000
      },
      {
        "type": "gold",
        "count": 5000
      },
      {
        "type": "none",
        "count": 0
      },
      {
        "type": "gold",
        "count": 500000
      },
      {
        "type": "again",
        "count": 1
      },
      {
        "type": "gold",
        "count": 1000
      },
      {
        "type": "gold",
        "count": 2000
      },
      {
        "type": "gold",
        "count": 10000
      },
      {
        "type": "none",
        "count": 0
      },
      {
        "type": "gold",
        "count": 100000
      }
    ],
    "DrawProbability": [
      0.1,
      0.1,
      0.03,
      0.05,
      0,
      0.1,
      0.4,
      0.15,
      0,
      0.05,
      0
    ]
  },
  // 战队
  club: {
    // 改名需要的房卡
    gemRename: 200,
    // 名字最大长度
    maxNameLength: 10,
    // 房主转出需要的房卡
    transferOutGem: 500,
    // 转入需要的房卡
    transferInGem: 500,
    // 解锁游戏需要的房卡
    unlockGameGem: 200,
  }
}
