import * as os from "os";
import * as path from "path";
import * as logger from 'winston';
import * as https from 'https';
import PlayerModel from '../../database/models/player';
import PlayerManager from '../../player/player-manager';
import * as config from '../../config';
import GameRecord from '../../database/models/gameRecord'
import RoomRecord, {SELF_CATEGORY} from '../../database/models/roomRecord'
import RankList from '../../database/models/rankList'
import GM from '../../database/models/gm'
import Product from '../../database/models/product'
import BuyProductRecord from '../../database/models/buyRecord'
import AccountIdModel from '../../database/models/accountId';
import * as moment from 'moment'
import {RedPocketWithdrawRecordModel, RedPocketWithDrawState} from "../../database/models/redPocketRecord";
import {createLock, withLock} from "../../utils/lock";
import {batches_transfer} from '../../wechatPay/batches_transfer'
import createClient from "../../utils/redis";
import {ConsumeRecord} from "@fm/model/models/consumeRecord";
import DiamondRecord from "../../database/models/diamondRecord";
import {ConsumeLogType} from "@fm/common/constants";
import Task from "../../database/models/task";

const QcloudSms = require("qcloudsms_js");

const redisClient = createClient();

const allGameName = ['paodekuai', 'niuniu', 'zhadan', 'majiang', 'shisanshui']

const locker = createLock(redisClient)


const wechatPayMent = new batches_transfer({
  mchId: config.wx.mchId,
  appId: config.wx.app_id,
  key: config.wx.sign_key,
  serial_no: config.wx.serial_no,
  certFilePath: path.join(__dirname, "..", "..", "..", "apiclient_cert.pem"),
  keyFilePath: path.join(__dirname, "..", "..", "..", "apiclient_key.pem")
});

async function sendSMS(player, phoneNum, smsCode, countDown = 1) {
  const appid = 1400195814;
  const appkey = "8332c9c20fe950b8a5c5daebab4f6ffe";

  const phoneNumbers = [phoneNum];

  const templateId = 303836;

  const smsSign = "";
  const qcloudsms = QcloudSms(appid, appkey);
  async function callback(err, res, resData) {
    if (err) {
      console.log("err: ", err);
      player.sendMessage('account/getSMSCodeReply',{ok: false, info: err})
    } else {

      await redisClient.setAsync(phoneNum, smsCode, 'ex', countDown * 60)
      player.sendMessage('account/getSMSCodeReply',{ok: true, info: '短信已发送', countDown})
    }
  }

  const ssender = qcloudsms.SmsSingleSender();
  const params = [smsCode, countDown];

  ssender.sendWithParam(86, phoneNumbers[0], templateId,
    params, smsSign, "", "", callback);


}

function getLocalIP() {
  if (process.env.NODE_ENV === 'production') {
    try {
      return os.networkInterfaces().eth0[0].address
    } catch (e) {
      return '127.0.0.1'
    }
  }
  return '127.0.0.1'
}

const LOCAL_IP = getLocalIP()

function resetPlayerLuckyDrawChance(id, p, onSuccess) {
  const player = p;
  PlayerModel.update({_id: id},
    {
      $set: {
        luckyDraw: {
          date: new Date().toLocaleDateString(),
          time: 1,
          usedLuckDrawTimes: 0,
        },
      },
    },
    (err) => {
      if (err) {
        logger.error(err);
        return;
      }
      player.model.luckyDraw.time = 1;
      player.model.luckyDraw.usedLuckDrawTimes = 0;
      if (onSuccess) {
        onSuccess();
      }
    });
}

function clearUnNoticedGiftMsg(id) {
  PlayerModel.update({_id: id},
    {
      $unset: {
        receivedGiftResource: [],
      },
    },
    (err) => {
      if (err) {
        logger.error(err);
        return;
      }
    });
}


function addResource(playerId, {ruby = 0, gem = 0, gold = 0}) {
  const player = PlayerManager.getInstance().getPlayer(playerId)
  if (player) {
    player.sendMessage('gmTool/addResource', {
      ruby,
      gem,
      gold,
    });
    player.model.ruby += ruby
    player.model.gem += gem
    player.model.gold += gold
  }
}

export default {
  'account/weChatCode': async (p, message) => {
    console.log(message.code);
    const appid = '';
    const appSecret = '';
    // https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
    const options = {
      hostname: 'api.weixin.qq.com',
      port: 80,
      path: `/sns/oauth2/access_token?appid=${appid}&secret=${appSecret}&code=${message.code}&grant_type=authorization_code`,
      method: 'GET',
      // headers: {
      //   'Content-Type': 'application/x-www-form-urlencoded',
      // },
    };
    const reqCodeRes = await https.get(options);
    console.log(reqCodeRes);
    reqCodeRes.on('data', (data) => {
      console.log(data);
    });
  },
  'account/gameReplayList': async (player, message) => {
    if (player.model) {
      let room = message.room
      let records = await GameRecord
        .find({room})
        .select({playersInfo: 1, record: 1, time: 1, states: 1, game: 1, juShu: 1})
        .sort({time: 1})
        .lean()
        .exec()
      //最后一局解散，出现多余战绩bug(例如共12局出现13.14局战绩)，用规则限制个数
      // 查找房间规则
      const roomRecord = await RoomRecord.findOne({ room });
      let allJuShu = 1;
      if (roomRecord) {
        allJuShu = roomRecord.rule.juShu;
      }
      records = records.splice(0,allJuShu)
      records.forEach((record) => {
        record.record.sort((p1, p2) => {
          if (p1 && p2) {
            p1.name.localeCompare(p2.name)
          }
        })
      })

      player.sendMessage('account/gameReplayListReply', records)
    }
  },
  'account/gameReplay': async (player, message) => {
    if (player.model) {
      let id = message._id
      let replay = await GameRecord.findOne({_id: id}).lean().exec()
      player.sendMessage('account/gameReplayReply', replay)
    }
  },
  'account/topPlayers': async (player) => {
    const current = await PlayerModel
      .find()
      .select({name: 1, headImgUrl: 1, shortId: 1, gold: 1})
      .sort({gold: -1})
      .limit(30)
      .lean()
      .exec()
    const rank = await RankList.findOne().sort({createAt: -1}).exec()

    const prevPlayers = rank && rank.players
    player.sendMessage('account/topPlayersReply', {
      current,
      prev: prevPlayers || [],
      me: player.model
    })
  },
  'account/prevTopPlayers': async (player) => {
    const rank = await RankList.findOne().sort({createAt: -1}).exec()
    let prevPlayers = rank && rank.players || []
    prevPlayers = prevPlayers.slice(0, 3)
      .map(p => ({
        name: p.name
      }))

    player.sendMessage('account/prevTopPlayersReply', {prev: prevPlayers})
  },
  'account/fromInvite': async (player, {inviteCode}) => {
    const gm = await GM.findOne({inviteCode}, {_id: 1}).lean().exec()
    if (!gm) {
      player.sendMessage('account/fromInviteReply', {ok: false, info: '无效邀请码'})
      return
    }

    const inviteBy = gm._id
    const playerId = player.model._id
    const playerModel = await PlayerModel.findOne({_id: playerId}).exec()

    if (!playerModel) {
      player.sendMessage('account/fromInviteReply', {ok: false, info: '玩家不存在'})
      return
    }

    if (playerModel.inviteBy) {
      player.sendMessage('account/fromInviteReply', {ok: false, info: '已经有邀请人'})
      return
    }

    playerModel.inviteBy = inviteBy
    playerModel.gem += 20
    addResource(playerId, {gem: 20, gold: 0})
    await playerModel.save()
    player.sendMessage('account/fromInviteReply', {ok: true})
  },
  'account/updatePosition': async (player, position) => {
    if (player.model) {
      player.model.position = position
    }
  },
  'account/buyProduct': async (player, {productId, phone, wechat}) => {
    const product = await Product.findOne({_id: productId}).lean().exec()
    if (!product) {
      player.sendMessage('account/buyProductReply', {ok: false, info: '商品不存在'})
      return
    }

    if (!product.onStock) {
      player.sendMessage('account/buyProductReply', {ok: false, info: '商品已经下架'})
      return
    }

    const playerId = player._id

    const playerModel = await PlayerModel.findOne({_id: playerId}).exec()

    let canBuy = false
    if (product.rubyPrice > 0) {
      canBuy = playerModel.ruby >= product.rubyPrice;
    } else {
      canBuy = true
    }
    if (product.goldPrice > 0) {
      canBuy = canBuy && playerModel.gold >= product.goldPrice
    }

    if (canBuy) {
      await new BuyProductRecord({
        product: product._id,
        productName: product.name,
        productPrice: {rubyPrice: product.rubyPrice, goldPrice: product.goldPrice},
        player: playerModel._id,
        state: 'paid',
        wechat, phone
      }).save()


      playerModel.ruby -= product.rubyPrice
      playerModel.gold -= product.goldPrice
      await playerModel.save()
      addResource(playerId, {ruby: -product.rubyPrice, gold: -product.goldPrice})
      player.sendMessage('account/buyProductReply', {ok: true, info: '购买成功'})
    } else {
      player.sendMessage('account/buyProductReply', {ok: false, info: '金币/宝石不足'})
    }
  },
  'account/buyRecords': async (player) => {
    const records = await BuyProductRecord.find({player: player._id}).sort({createAt: -1})
    player.sendMessage('account/buyRecordsReply', {ok: true, records})
  },
  'account/products': async (player) => {
    const products = await Product.find({onStock: true}).sort({createAt: -1})
    player.sendMessage('account/productsReply', {ok: true, products})
  },
  'account/getInviteDate': async (player) => {
    var inviterPlyaers = []
    var invite_players = await PlayerModel.find({invite_byFriend: player.model.shortId}).exec()

    console.log("************ getInviteDate ")
    for (let i = 0; i < invite_players.length; i++) {
      var e = invite_players[i];
      var id = e._id;
      var gameRound = "0";
      gameRound = await GameRecord.count({
        players: id
      }).exec();
      var time = moment(e.invite_byTime).format('YYYY-MM-DD HH:mm')
      var p = {shortId: e.shortId, name: e.name, invite_byTime: time, gameRecordCount: gameRound}
      inviterPlyaers.push(p);

    }

    player.sendMessage('account/getInviteDateReply', inviterPlyaers)

  },
  'account/TaskMsg': async (player) => {
    const taskList = await Task.find().select().exec();
    var taskMsg = {}
    if (!player.model.invite_curTask.length && !player.model.invite_endTask.length) {
      taskList.forEach((e) => {
        player.model.invite_curTask.push(e.index);
      })
      player.model.invite_endTask = [];
      PlayerModel.update({_id: player._id}, {
          $set: {
            invite_curTas: player.model.invite_curTask,
            invite_endTask: player.model.invite_endTask,
          },
        },
        (err) => {
          if (err) {
            logger.error(err);
            return;
          }

        })
    }
    var cTasks = player.model.invite_curTask;
    var eTasks = player.model.invite_endTask;
    var invite_players = [];
    invite_players = await PlayerModel.find({invite_byFriend: player.model.shortId}).exec();
    var curTaskList = [];
    var endTaskList = [];


    taskList.forEach((task) => {

      eTasks.forEach(index => {

        taskMsg = {taskIndex: null, taskName: null, taskProgress: null, taskStatus: null, progressStr: null}
        var endTaskindex = index;
        if (endTaskindex == task.index) {
          taskMsg.taskIndex = endTaskindex;
          taskMsg.taskName = task.name;
          taskMsg.taskStatus = 2//0完成领取奖励、1进行中、2已达成。
          taskMsg.taskProgress = 1;

          if (task.condition.inviterShortId) {
            taskMsg.progressStr = "1/1";
          } else {
            taskMsg.progressStr = `${task.condition.invitePlayers}/${task.condition.invitePlayers}`;
          }
          endTaskList.push(taskMsg)
        }
      })

      cTasks.forEach((index) => {
        var curTaskindex = index;
        taskMsg = {taskIndex: null, taskName: null, taskProgress: null, taskStatus: null, progressStr: null}
        if (curTaskindex == task.index) {
          taskMsg.taskIndex = curTaskindex;
          taskMsg.taskName = task.name;
          if (task.condition.inviterShortId) {//填写短ID任务类型
            taskMsg.taskStatus = 0;//0完成领取奖励、1进行中、2已达成。

            if (player.model.invite_byFriend != null) {
              taskMsg.taskProgress = 1
              taskMsg.progressStr = "1/1"
            } else {
              taskMsg.taskProgress = 0
              taskMsg.progressStr = "0/1"
            }
          } else {//邀请人数任务类型
            taskMsg.taskStatus = 1;//0完成领取奖励、1进行中、2已达成。
            var progress = invite_players.length / task.condition.invitePlayers;


            var mcPlayerNum = invite_players.length > task.condition.invitePlayers ? task.condition.invitePlayers : invite_players.length
            taskMsg.progressStr = mcPlayerNum + "/" + task.condition.invitePlayers;
            taskMsg.taskProgress = progress.toFixed(2);
            if (progress >= 1) {
              taskMsg.taskStatus = 0;
              taskMsg.taskProgress = 1;
            }
          }
          curTaskList.push(taskMsg)
        }
      })
    })
    var inviteNum = invite_players.length ? invite_players.length : 0
    var allTasks = curTaskList.concat(endTaskList)
    player.sendMessage('account/TaskMsgReply', {tasks: allTasks, inviteNum: inviteNum});
  },
  'account/InviteFriendPrizes': async (player, message) => {

    console.log("************ InviteFriendPrizes ")
    const friends = await PlayerModel.find({invite_byFriend: player.model.shortId}).select({_id: 1}).exec();
    const cTask = player.model.invite_curTask;
    const eTask = player.model.invite_endTask;
    const taskIndex = parseInt(message.taskIndex);
    const task = await Tasks.findOne({
      index: taskIndex
    }).exec();

    const playerId = player.model._id
    const playerModel = await PlayerModel.findOne({
      _id: playerId
    }).exec()
    var msgReply = "领取失败";
    var msg = {taskIndex: taskIndex, taskName: task.name, taskProgress: null, taskStatus: null, progressStr: null}//
    if (cTask.contains(taskIndex)) {
      msg.taskStatus = 1
    }//0完成领取奖励、1进行中、2已达成。
    var missionCompleted = async () => {
      if (taskIndex) {
      } else {

        msgReply = "无此奖励"
        return false;
      }
      var mcPlayerNum = friends.length;
      if (task.condition.gameRound) {
        mcPlayerNum = 0;
        for (let p = 0; p < friends.length; p++) {
          var invitePlayerId = friends[p];
          var played = await GameRecord.count({
            players: invitePlayerId._id
          }).exec();
          if (played > task.condition.gameRound) {
            mcPlayerNum += 1;
          }
        }
      }
      if (cTask.contains(taskIndex)) {//任务在列表中
        if (task.condition.invitePlayers) { //邀请人数任务 满足条件
          if (mcPlayerNum >= task.condition.invitePlayers) {
            msg.taskStatus = 2//0完成领取奖励、1进行中、2已达成。
            msg.taskProgress = 1;
            msg.progressStr = task.condition.invitePlayers + "/" + task.condition.invitePlayers
            return true;
          } else {
            msgReply = "邀请人数未达标，领取失败"
          }
        }

        if (task.condition.inviterShortId) { //填写邀请短Id任务，满足条件
          if (player.model.invite_byFriend) {
            msgReply = "已填写过好友ID,领取失败"
            return false
          }
          if (message.inviterShortId == player.model.shortId) {
            msgReply = "不能填写自己的ID,领取失败"
            return false
          }
          var pId = await PlayerModel.findOne({
            shortId: message.inviterShortId
          });

          if (pId) {

            PlayerModel.update({shortId: player.model.shortId}, {
                $set: {
                  invite_byFriend: message.inviterShortId,
                  invite_byTime: new Date(),
                },
              },
              (err) => {
                if (err) {
                  logger.error(err);
                  return;
                }

              })
            msg.taskStatus = 2;//0完成领取奖励、1进行中、2已达成。
            msg.taskProgress = 1;
            msg.progressStr = "1/1"
            return true;
          } else {
            msgReply = "查无此玩家，领取失败"
          }
        }
      }
      return false;
    }
    var awards = () => {
      if (task.prize.gem) {
        msg.tips = `获得${task.prize.gem}钻石`
        addResource(playerId, {gem: task.prize.gem})
        playerModel.gem += task.prize.gem;
      }
      if (task.prize.lotteryChance) {
        //TODO,luckyDraw.Time每天还原为1次，并加上邀请好友获得的奖励次数lotteryChance
        msg.tips = `获得${task.prize.lotteryChanc}次幸运转盘抽奖机会`
        playerModel.luckyDraw.invite_time += task.prize.lotteryChance;
      }


      cTask.remove(taskIndex);
      eTask.push(taskIndex);
      playerModel.invite_curTask = cTask;
      playerModel.invite_endTask = eTask;

      player.sendMessage('account/inviteReply', {ok: true, info: msg})
      PlayerModel.update({_id: playerId},
        {
          $set: {
            invite_curTask: playerModel.invite_curTask,
            invite_endTask: playerModel.invite_endTask,
            luckyDraw: playerModel.luckyDraw,
          },
          $inc: {
            gem: task.prize.gem,
          }
        },
        (err) => {
          if (err) {
            logger.error(err);
            return;
          }
        });
    }
    var mc = await missionCompleted();
    if (mc == true) {
      awards();
    } else {
      player.sendMessage('account/inviteReply', {
        ok: false,
        info: msgReply
      })
    }
  },
  'account/getIdCheckInfo': async (player) => {
    const checkCode = await AccountIdModel.findOne({player: player._id}).exec();
    const needCheckCode = checkCode == null;
    player.sendMessage('account/idCheckInfo', {needCheckCode: needCheckCode})
  },
  'account/idCheck': async (player, message) => {
    var idCode = await AccountIdModel.findOne({player: player._id}).exec()
    var birthYear = message.identifyCode.substring(6, 10);
    var date = new Date()
    var nowYear = date.getFullYear()
    var isAdult = true
    if (nowYear - birthYear < 18) {
      isAdult = false;
    }
    if (idCode == null && isAdult) {
      await AccountIdModel.findOrCreate({player: player._id}, {player: player._id, ...message});
      var idCheckPrize = 6;
      player.model.gem += idCheckPrize;
      await PlayerModel.update({_id: player.model._id},
        {
          $inc: {
            gem: idCheckPrize,
          }
        });

      new ConsumeRecord({
        player: player._id,
        note: `实名认证 => ${player.model.gem}/${player.model.gold}`,
        createAt: new Date(),
        gem: idCheckPrize, gold: 0
      }).save();

      new DiamondRecord({
        player: player.model._id,
        amount: idCheckPrize,
        residue: player.model.gem,
        type: ConsumeLogType.realName,
        note: `实名认证赠送钻石${idCheckPrize}个`,
      }).save()

      player.model.needCheckCode = false;
      await player.updateResource2Client();
      // player.sendMessage('resource/update', {gem: player.model.gem})
    } else {
      player.model.needCheckCode = true;
    }
    player.sendMessage('account/idCheckReply', {needCheckCode: player.model.needCheckCode})

  },
  'account/withdrawRedPocket': async (player) => {
    try {
      await withLock('red-pocket-withdraw', 7000, async () => {
        const playerModel = await PlayerModel.findById(player._id)

        if (playerModel && !playerModel.openId) {
          return player.sendMessage('account/withdrawRedPocketReply',
            {ok: false, info: '微信搜索并关注公众号“凡盟网络科技”后下方绑定游戏账号'})
        }

        if (playerModel && playerModel.redPocket >= 1500) {

          const record = await RedPocketWithdrawRecordModel.create({
            player: playerModel._id,
            state: RedPocketWithDrawState.init,
            amountInFen: 1500,
            createAt: new Date()
          })

          let tem_batch_no = record._id.toString().concat("12345678");
          const tranRes = await wechatPayMent.batches_transfer({
            out_batch_no: tem_batch_no,
            batch_name: '天乐麻将红包提现',
            batch_remark: '天乐麻将红包提现',
            total_amount: 1500,
            total_num: 1,
            transfer_detail_list: [
              {
                out_detail_no: tem_batch_no,
                transfer_amount: 1500,
                transfer_remark: '天乐麻将红包提现',
                openid: playerModel.openId,
              },
            ],
          });

            if (tranRes.status == '200') {
              const updated = await PlayerModel.findByIdAndUpdate(player._id, {$inc: {redPocket: -1500}}, {'new': true})

              record.info = '完成'
              record.state = RedPocketWithDrawState.finished
              record.paymentId = tranRes.batch_id
              await record.save()

              return player.sendMessage('account/withdrawRedPocketReply',
                {ok: true, redPocket: updated.redPocket})


            } else {
              record.info = tranRes.err_code_des
              //record.state = RedPocketWithDrawState.error
              record.state = tranRes.status
              await record.save()
              return player.sendMessage('account/withdrawRedPocketReply',
                {ok: false, info: '提款失败,稍后再试!'})
            }


        } else {
          return player.sendMessage('account/withdrawRedPocketReply', {ok: false, info: '红包金额超过15元才能提现'})
        }
      }, locker)
    } catch (error) {

      logger.error({
        scope: 'account/withdrawRedPocket', error: error.message,
        stack: error.stack
      })
    }
  },
  'account/withdrawRedPocketRecords': async (player) => {
    const records = await RedPocketWithdrawRecordModel
      .find({player: player._id})
      .sort({createAt: -1})
      .limit(50)
      .lean()

    player.sendMessage('account/withdrawRedPocketRecordsReply', {ok: true, records})
  },
  'account/getRedPocketInfo': async (player) => {
    const playerModel = await PlayerModel.findById(player._id)

    if (playerModel) {
      player.sendMessage('account/getRedPocketInfoReply',
        {ok: true, redPocket: playerModel.redPocket})
    } else {
      player.sendMessage('account/getRedPocketInfoReply',
        {ok: false, info: '查询失败！'})
    }
  },
  'account/getSMSCode': async (player, message) => {
    if(!message.phoneNum || message.phoneNum.length !== 11 ) {
      player.sendMessage('account/getSMSCodeReply', {ok: false, info: `手机号码错误。`});
      return
    }

    const tempSmsCode = await redisClient.getAsync(message.phoneNum)
    if(tempSmsCode) {
      player.sendMessage('account/getSMSCodeReply', {ok: false, info: `验证码已发送，请查看短信获取。`});
      return
    }

    const smsCode = await redisClient.lpopAsync(`smsCodes`)
    if(!smsCode) {
      player.sendMessage('account/getSMSCodeReply', {ok: false, info: `验证码生成错误。`});
      return
    }
    await redisClient.rpushAsync('smsCodes', smsCode)
    const countDown = 1

    await sendSMS(player, message.phoneNum, smsCode, countDown)
  },
  'account/bindPhone': async (player, message) => {
    const doc = await PlayerModel.findOne({phone: message.phoneNum}).exec()
    if(doc) {
      player.sendMessage('account/bindPhoneReply', {ok: false, info: `手机号${message.phoneNum}已绑定其它微信号。`});
      return
    }
    const smsCode = await redisClient.getAsync(message.phoneNum)
    if(!smsCode) {
      player.sendMessage('account/bindPhoneReply', {ok: false, info: `验证码超时或验证码错误。`});
      return
    }

    if(message.smsCode.toString() !== smsCode) {
      player.sendMessage('account/bindPhoneReply', {ok: false, info: '绑定失败！'})
      return
    }
    let Msg = ""

    if(!player.model.phone) {
      // const addGem = 10;
      // await  PlayerModel.update({_id: player._id},{$inc:{gem: addGem}},false,false)
      // Msg = `绑定成功！获得${addGem}个钻石`
      // player.model.phone = message.phoneNum;
      // await player.updateResource2Client();
      // // player.sendMessage('resource/update', {ok:true, gem: player.model.gem + addGem})
      //
      // new ConsumeRecord({
      //   player: player._id,
      //   note: `绑定手机 => ${player.model.gem+10}/${player.model.gold}`,
      //   createAt: new Date(),
      //   gem: 10, gold: 0
      // }).save();
      // new DiamondRecord({
      //   player: player.model._id,
      //   amount: addGem,
      //   residue: player.model.gem+10,
      //   type: ConsumeLogType.bindPhone,
      //   note: `绑定手机赠送钻石${addGem}个`,
      // }).save()
      Msg = `绑定成功！`
    } else {
      Msg = `换绑成功！`
    }
    await PlayerModel.findOneAndUpdate(
      {_id: player._id},
      {phone: message.phoneNum},
      {"new": true})

    player.sendMessage('account/bindPhoneReply', {ok:true, info: Msg})
  },
  'resource/getInfo': async (p) => {
    return p.updateResource2Client();
    // const player = await PlayerModel.findById(p._id).lean()
    // if (!player) {
    //   return
    // }
    // let msg = {
    //   gem: player.gem
    // }
    // p.sendMessage('resource/update', msg)
  }
};
