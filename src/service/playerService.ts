// @ts-ignore
import * as faker from 'faker';
import * as mongoose from 'mongoose';
import * as config from "../config";
import {getNewPlayerInviteCode, getNewShortPlayerId} from "../database/init";
import ConsumeRecord from "../database/models/consumeRecord";
import DiamondRecord from "../database/models/diamondRecord";
import PlayerModel from "../database/models/player";
import Player from "../database/models/player";
import BaseService from "./base";
import {service} from "./importService";
import * as moment from "moment";
import PlayerLoginRecord from "../database/models/playerLoginRecord";
import PlayerManager from "../player/player-manager";
import UserRechargeOrder from "../database/models/userRechargeOrder";
import {ConsumeLogType, RedisKey, TaskType, TianleErrorCode} from "@fm/common/constants";
import GoldRecord from "../database/models/goldRecord";
import HeadBorder from "../database/models/HeadBorder";
import PlayerHeadBorder from "../database/models/PlayerHeadBorder";
import Medal from "../database/models/Medal";
import PlayerMedal from "../database/models/PlayerMedal";
import CardTable from "../database/models/CardTable";
import PlayerCardTable from "../database/models/PlayerCardTable";
import NewTask from "../database/models/newTask";
import NewTaskRecord from "../database/models/NewTaskRecord";
import NewFirstRecharge from "../database/models/NewFirstRecharge";
import NewFirstRechargeRecord from "../database/models/NewFirstRechargeRecord";
import RechargeParty from "../database/models/RechargeParty";
import PlayerRechargePartyRecord from "../database/models/PlayerRechargePartyRecord";
import TaskRecord from "../database/models/TaskRecord";
import TaskTotalPrize from "../database/models/TaskTotalPrize";
import TaskTotalPrizeRecord from "../database/models/TaskTotalPrizeRecord";
import Task from "../database/models/task";
import RoomScoreRecord from "../database/models/roomScoreRecord";
import VipConfig from "../database/models/VipConfig";
import MonthGift from "../database/models/MonthGift";
import MonthGiftRecord from "../database/models/MonthGiftRecord";
import PlayerAttr from "../database/models/playerAttr";
import TurntablePrize from "../database/models/turntablePrize";
import TurntablePrizeRecord from "../database/models/turntablePrizeRecord";
import PlayerPayDailySupplementRecord from "../database/models/PlayerPayDailySupplementRecord";
import RegressionRechargeRecord from "../database/models/RegressionRechargeRecord";
import RegressionSignPrize from "../database/models/RegressionSignPrize";
import RegressionSignPrizeRecord from "../database/models/RegressionSignPrizeRecord";

// 玩家信息
export default class PlayerService extends BaseService {
    async getPlayerModel(playerId: string): Promise<any> {
        return Player.findById(playerId);
    }

    async getPlayerModelByShortId(shortId: number): Promise<any> {
        return Player.findOne({shortId});
    }

    // 根据用户名获取玩家
    async getPlayerByName(name) {
        return Player.find({name});
    }

    // 创建用户
    async createNewPlayer(opt) {
        const username = await this.generateUsername();
        const modelId = new mongoose.Types.ObjectId();
        return PlayerModel.create({
            _id: opt._id ? opt._id : modelId,
            name: opt.name ? opt.name : username,
            // 房卡
            gem: config.game.initModelGemCount,
            headImgUrl: opt.headImgUrl ? opt.headImgUrl : 'https://wx-remote.tianle.fanmengonline.com/defaultAvatar/man.png',
            sex: opt.sex || 1,
            gold: opt._id ? config.game.initModelGoldCount : 0,
            ruby: opt.ruby || config.game.initModelRuby,
            platform: opt.platform || '',
            luckyDraw: {
                date: new Date().toLocaleDateString(),
                time: 1,
            },
            phone: opt.phoneNum || '',
            isTourist: !opt._id,
            openId: opt.openId || '',
            miniOpenid: opt.miniOpenid || '',
            appleId: opt.appleId || '',
            shortId: await getNewShortPlayerId(),
            inviteCode: await getNewPlayerInviteCode(),
            sessionKey: opt.sessionKey || '',
        })
    }

    // 生成随机用户名
    async generateUsername() {
        const lastName = faker.name.lastName();
        return lastName.toLowerCase();
    }

    async logOldGemConsume(playerId, note, gem) {
        new ConsumeRecord({
            player: playerId,
            note,
            createAt: new Date(),
            gem,
        }).save();
    }

    // 扣除并记录房卡
    async logAndConsumeDiamond(playerId, type, amount, note) {
        const model = await this.getPlayerModel(playerId);
        if (model.diamond < amount) {
            return {isOk: false};
        }
        model.diamond -= amount;
        await model.save();
        await this.logGemConsume(model._id, type, -amount, model.diamond, note);
        return {isOk: true, model};
    }

    // 记录房卡消耗
    async logGemConsume(playerId, type, amount, totalAmount, note, propId = null) {
        await DiamondRecord.create({
            player: playerId,
            amount,
            residue: totalAmount,
            type,
            note,
            propId,
            createAt: new Date(),
        })
    }

    // 记录金豆消耗
    async logGoldConsume(playerId, type, amount, totalAmount, note) {
        await GoldRecord.create({
            player: playerId,
            amount,
            residue: totalAmount,
            type,
            note,
            createAt: new Date(),
        })
    }

    // 获取玩家属性值
    async getPlayerAttrValueByShortId(shortId, attrType, name) {
        const record = await PlayerAttr.findOne({
            shortId,
            attrType,
            name,
        })
        if (record) {
            return record.value;
        }
        return null;
    }

    // 添加或更新用户属性
    async createOrUpdatePlayerAttr(playerId, shortId, attrType, attrValue, name) {
        let record = await PlayerAttr.findOne({
            shortId,
            attrType,
            name,
        })
        if (record) {
            record.value = attrValue;
            await record.save();
        } else {
            record = await PlayerAttr.create({
                playerId,
                shortId,
                attrType,
                name,
                value: attrValue,
            })
        }
        return record;
    }

    // 根据邀请码获取用户
    async getPlayerByInviteCode(inviteCode: number) {
        const result = await Player.findOne({inviteCode});
        if (result) {
            return result;
        }
        return null;
    }

    async getLocation(user_ip, current_ip) {
        if (!user_ip) {
            user_ip = current_ip;
        }

        const res = await service.base.curl(`https://ips.market.alicloudapi.com/iplocaltion?ip=${user_ip}`, {
            method: "get",
            headers: {
                Authorization: "APPCODE " + config.ipConfig.appCode
            }
        });

        return JSON.parse(res.data);
    }

    // 每日活跃抽奖
    async draw(player) {
        const list = await TurntablePrize.find({
            // 忽略空奖励
            probability: {
                $gt: 0,
            },
            // 实际数量大于 0
            residueNum: {
                $gt: 0,
            },
        });

        const hitPrize = await service.lottery.randomWithNoPrize(list);
        // 抽奖记录
        const record = await this.recordLottery(player._id.toString(), player.shortId,
            hitPrize && hitPrize._id || null);
        return {isOk: true, times: player.turntableTimes, record};
    }

    // 记录抽奖记录
    async recordLottery(playerId, shortId, prizeId) {
        // 是否中奖
        const isHit = !!prizeId;
        let conf;
        if (prizeId) {
            conf = await this.getPrize(prizeId);
            if (!conf) {
                // 没有奖品配置
                console.error('no lottery prize', prizeId, playerId, shortId);
                return null;
            }
        }

        return await TurntablePrizeRecord.create({
            playerId,
            shortId,
            prizeConfig: conf || null,
            prizeId: conf && conf._id || null,
            createAt: new Date(),
            isHit,
        });
    }

    // 检查奖品是否存在
    async getPrize(prizeId) {
        return await TurntablePrize.findById(prizeId);
    }

    async checkUserRegist(user, data) {
        if (user) {
            const playerManager = PlayerManager.getInstance();
            // 检查重复登录
            await this.checkIsLogging(user._id.toString());
            // 处理正在登录
            playerManager.addLoggingInPlayer(user._id.toString());

            // 判断昨日是否登录
            const start = moment().subtract(1, 'day').startOf('day').toDate();
            const end = moment().subtract(1, 'day').endOf('day').toDate();
            const today_start = moment(new Date()).startOf('day').toDate();
            const today_end = moment(new Date()).endOf('day').toDate();
            const yestodayLoginCount = await PlayerLoginRecord.count({
                createAt:
                    {$gte: start, $lt: end}, playerId: user._id.toString()
            });
            const todayLoginCount = await PlayerLoginRecord.count({
                createAt:
                    {$gte: today_start, $lt: today_end}, playerId: user._id.toString()
            });
            if (yestodayLoginCount === 0) {
                user.consecutiveLoginDays = 1;
            }
            if (yestodayLoginCount > 0 && todayLoginCount === 0) {
                user.consecutiveLoginDays++;
            }

            // 判断是否有省市ip信息
            if (!user.province || !user.city) {
                const result = await this.getLocation(user.ip, data.ip);
                if (result.code === 200) {
                    user.province = result.data.result.prov;
                    user.city = result.data.result.city;
                }
            }

            // 更新sessionKey
            if (data.sessionKey) {
                user.sessionKey = data.sessionKey;
            }

            // 判断回归时间
            if (user.loginTime && new Date().getTime() - Date.parse(user.loginTime) > 1000 * 60 * 60 * 24 * config.game.regressionDissolveDay) {
                user.regressionTime = new Date();
            }

            user.loginTime = new Date();

            await user.save();

            if (todayLoginCount === 0) {
                await PlayerLoginRecord.create({
                    playerId: user._id.toString(),
                    shortId: user.shortId
                })
            }
        } else {
            const result = await this.getLocation(null, data.ip);
            if (result.code === 200) {
                data["province"] = result.data.result.prov;
                data["city"] = result.data.result.city;
            }
            user = await Player.create(data);
            const playerManager = PlayerManager.getInstance();
            // 检查重复登录
            await this.checkIsLogging(user._id.toString());
            // 处理正在登录
            playerManager.addLoggingInPlayer(user._id.toString());
        }

        // 判断是否分配默认牌桌
        const playerCardTableCount = await PlayerCardTable.count({playerId: user._id, propId: 1200});
        if (!playerCardTableCount) {
            await PlayerCardTable.create({
                playerId: user._id,
                shortId: user.shortId,
                propId: 1200,
                times: -1,
                isUse: true
            });
        }

        // 判断是否分配默认头像框
        const playerHeadBorderCount = await PlayerHeadBorder.count({playerId: user._id, propId: 1000});
        if (!playerHeadBorderCount) {
            await PlayerHeadBorder.create({
                playerId: user._id,
                shortId: user.shortId,
                propId: 1000,
                times: -1,
                isUse: true
            });
        }

        return await Player.findOne({_id: user._id}).lean();
    }

    // 检查重复登录
    async checkIsLogging(playerId) {
        try {
            const playerManager = PlayerManager.getInstance();
            const oldPlayer = playerManager.getPlayer(playerId);
            if (oldPlayer) {
                // 下线旧账号
                await oldPlayer.disconnect();
                playerManager.removePlayer(playerId);
                return {isFinish: false};
            }
            return {isFinish: false};
        } catch (e) {
            return {isFinish: false};
        }
    }

    async playerRecharge(orderId, thirdOrderNo) {
        const order = await UserRechargeOrder.findOne({_id: orderId});
        if (!order) {
            return false;
        }

        const user = await Player.findOne({_id: order.playerId});
        if (!user) {
            return false;
        }

        user.diamond += order.diamond;
        user.dominateCount = Math.floor(Math.random() * 5) + 1;
        await user.save();

        order.status = 1;
        order.transactionId = thirdOrderNo;
        await order.save();

        // 增加日志
        await this.logGemConsume(user._id, ConsumeLogType.chargeByWechat, order.diamond, user.diamond, "微信充值");

        return true;
    }

    async playerVoucherRecharge(orderId, thirdOrderNo, player) {
        const order = await UserRechargeOrder.findOne({_id: orderId});
        if (!order) {
            return false;
        }

        const user = await Player.findOne({_id: order.playerId});
        if (!user) {
            return false;
        }

        user.diamond += order.diamond + order.firstTimeAmount + order.originPrice;
        user.dominateCount = Math.floor(Math.random() * 5) + 1;

        order.status = 1;
        order.transactionId = thirdOrderNo;
        await order.save();

        // 判断vip是否升级
        user.vipExperience += order.price * 100;
        const oldVipLevel = user.vip;

        const vipList = await VipConfig.find({vip: {$gt: user.vip}}).sort({vip: 1}).lean();
        for (let i = 0; i < vipList.length; i++) {
            if (user.vipExperience >= vipList[i].experience) {
                user.vip++;
                user.vipExperience -= vipList[i].experience;
            }
        }

        if (oldVipLevel < user.vip) {
            player.sendMessage("vip/upgrade", {ok: true, data: {oldVipLevel, newVipLevel: user.vip}});
        }

        await user.save();

        return true;
    }

    async playerPayMonthGift(orderId, thirdOrderNo, message) {
        const order = await UserRechargeOrder.findOne({_id: orderId});
        if (!order) {
            return false;
        }

        const user = await Player.findOne({_id: order.playerId});
        if (!user) {
            return false;
        }

        user.diamond += order.diamond;
        order.status = 1;
        order.transactionId = thirdOrderNo;
        await order.save();

        // 判断vip是否升级
        user.vipExperience += order.price * 100;

        const vipList = await VipConfig.find({vip: {$gt: user.vip}}).sort({vip: 1}).lean();
        for (let i = 0; i < vipList.length; i++) {
            if (user.vipExperience >= vipList[i].experience) {
                user.vip++;
                user.vipExperience -= vipList[i].experience;
            }
        }

        await user.save();

        // 购买月卡
        return await this.payGift(message, user);
    }

    async payGift(message, user) {
        const prizeInfo = await MonthGift.findOne({_id: message.giftId});
        const price = prizeInfo.dayList.find(item => item.day === message.day)?.price;
        const model = await service.playerService.getPlayerModel(user._id);

        // 按照奖励类型领取奖励
        for (let i = 0; i < prizeInfo.prizeList.length; i++) {
            prizeInfo.prizeList[i].number *= message.day;
            prizeInfo.prizeList[i].day = message.day;
            await this.receivePrize(prizeInfo.prizeList[i], user._id, 1, ConsumeLogType.payMonthGift);
        }

        // 更新月卡到期时间
        model.diamond -= price;
        model.turntableTimes += 10;
        if (!model.giftExpireTime || model.giftExpireTime < new Date().getTime()) {
            model.giftExpireTime = new Date().getTime();
        }
        model.giftExpireTime = model.giftExpireTime + 1000 * 60 * 60 * 24 * message.day;
        await model.save();

        // 创建领取记录
        const data = {
            playerId: user._id.toString(),
            day: message.day,
            prizeId: prizeInfo._id,
            prizeConfig: prizeInfo,
            multiple: 1,
            createAt: new Date()
        };

        await MonthGiftRecord.create(data);

        return data;
    }

    async receivePrize(prize, playerId, multiple = 1, type) {
        const user = await Player.findOne({_id: playerId});
        if (prize.type === 1) {
            user.diamond += prize.number * multiple;
            await service.playerService.logGemConsume(user._id, type, prize.number * multiple,
                user.diamond, `获得${prize.number * multiple}钻石`);
        }

        if (prize.type === 2) {
            user.gold += prize.number * multiple;
            await service.playerService.logGoldConsume(user._id, type, prize.number * multiple,
                user.gold, `获得${prize.number * multiple}金豆`);
        }

        if (prize.type === 3) {
            const config = await HeadBorder.findOne({propId: prize.propId}).lean();
            let playerHeadBorder = await PlayerHeadBorder.findOne({propId: prize.propId, playerId}).lean();

            // 如果头像框已过期，删除头像框
            if (playerHeadBorder && playerHeadBorder.times !== -1 && playerHeadBorder.times <= new Date().getTime()) {
                await PlayerHeadBorder.remove({_id: playerHeadBorder._id});
                playerHeadBorder = null;
            }

            if (config && !playerHeadBorder) {
                const data = {
                    propId: prize.propId,
                    playerId: user._id,
                    shortId: user.shortId,
                    times: prize.day ? (new Date().getTime() + 1000 * 60 * 60 * 24 * prize.day) : -1,
                    isUse: false
                }

                await PlayerHeadBorder.create(data);
            }

            // 如果用户已经拥有头像框，则在过期时间加上有效时间
            if (config && playerHeadBorder && playerHeadBorder.times !== -1) {
                await PlayerHeadBorder.update({
                    playerId: user._id,
                    propId: prize.propId
                }, {$set: {times: prize.day ? (playerHeadBorder.times + 1000 * 60 * 60 * 24 * prize.day) : -1}})
            }
        }

        if (prize.type === 4) {
            const config = await Medal.findOne({propId: prize.propId}).lean();
            let playerMedal = await PlayerMedal.findOne({propId: prize.propId, playerId}).lean();

            // 如果称号已过期，删除称号
            if (playerMedal && playerMedal.times !== -1 && playerMedal.times <= new Date().getTime()) {
                await PlayerMedal.remove({_id: playerMedal._id});
                playerMedal = null;
            }

            if (config && !playerMedal) {
                const data = {
                    propId: prize.propId,
                    playerId: user._id,
                    shortId: user.shortId,
                    times: -1,
                    isUse: false
                }

                await PlayerMedal.create(data);
            }
        }

        if (prize.type === 5) {
            const config = await CardTable.findOne({propId: prize.propId}).lean();
            let playerCardTable = await PlayerCardTable.findOne({propId: prize.propId, playerId}).lean();

            // 如果称号已过期，删除称号
            if (playerCardTable && playerCardTable.times !== -1 && playerCardTable.times <= new Date().getTime()) {
                await PlayerCardTable.remove({_id: playerCardTable._id});
                playerCardTable = null;
            }

            if (config && !playerCardTable) {
                const data = {
                    propId: prize.propId,
                    playerId: user._id,
                    shortId: user.shortId,
                    times: prize.day ? (new Date().getTime() + 1000 * 60 * 60 * 24 * prize.day) : -1,
                    isUse: false
                }

                await PlayerCardTable.create(data);
            }

            // 如果用户已经拥有牌桌，则在过期时间加上有效时间
            if (config && playerCardTable && playerCardTable.times !== -1) {
                await PlayerCardTable.update({
                    playerId: user._id,
                    propId: prize.propId
                }, {$set: {times: prize.day ? (playerCardTable.times + 1000 * 60 * 60 * 24 * prize.day) : -1}})
            }
        }

        if (prize.type === 6) {
            user.helpCount += prize.number * multiple;
        }

        if (prize.type === 7) {
            user.tlGold += prize.number * multiple;
            await service.playerService.logGoldConsume(user._id, type, prize.number * multiple, user.tlGold, `获得${prize.number * multiple}天乐豆`);
        }

        await user.save();
    }

    async getGuideLists(user) {
        const taskList = await NewTask.find().lean();
        let tasks = [];
        let receive = false;

        for (let i = 0; i < taskList.length; i++) {
            const task = await this.checkTaskState(taskList[i], user);
            if (!task.receive && task.finish) {
                receive = true;
            }
            tasks.push(task);
        }

        return {tasks, receive};
    }

    // 判断任务是否完成
    async checkTaskState(task, user) {
        const receiveCount = await NewTaskRecord.count({playerId: user._id, taskId: task.taskId});
        task.receive = !!receiveCount;
        const model = await service.playerService.getPlayerModel(user._id);
        // 完成10场游戏对局
        if (task.taskId === 1001) {
            task.finish = model.juCount >= task.taskTimes;
            task.finishCount = model.juCount;
        }

        // 完成3场游戏对局胜利
        if (task.taskId === 1002) {
            task.finish = model.juWinCount >= task.taskTimes;
            task.finishCount = model.juWinCount;
        }

        // 完成10次杠牌
        if (task.taskId === 1003) {
            task.finish = model.gangCount >= task.taskTimes;
            task.finishCount = model.gangCount;
        }

        // 商城购买钻石1次(任意金额)
        if (task.taskId === 1004) {
            const orderCount = await DiamondRecord.count({player: user._id, type: ConsumeLogType.voucherForDiamond});
            task.finish = orderCount >= task.taskTimes;
            task.finishCount = orderCount;
        }

        // 观看1次广告
        if (task.taskId === 1005) {
            task.finish = task.receive;
            task.finishCount = task.finish ? 1 : 0;
        }

        return task;
    }

    async getFirstRechargeList(user) {
        const summary = await UserRechargeOrder.aggregate([
            {$match: {playerId: user._id.toString(), status: 1}},
            {$group: {_id: null, sum: {$sum: "$price"}}}
        ]).exec();
        let rechargeAmount = 0;
        if (summary.length > 0) {
            rechargeAmount = summary[0].sum;
        }

        // 计算完成任务时间
        let finishTime = null;
        if (rechargeAmount >= 6) {
            const rechargeList = await UserRechargeOrder.find({playerId: user._id.toString(), status: 1});
            let sumaryAmount = 0;

            for (let i = 0; i < rechargeList.length; i++) {
                sumaryAmount += rechargeList[i].price;

                if (sumaryAmount >= 6) {
                    finishTime = rechargeList[i].created;
                    break;
                }
            }
        }

        const taskList = await NewFirstRecharge.find().lean();
        const receive = false;

        for (let i = 0; i < taskList.length; i++) {
            let receive = await NewFirstRechargeRecord.count({playerId: user._id, "prizeConfig.day": taskList[i].day});
            taskList[i].receive = !!receive;
            if (!taskList[i].receive) {
                receive = true;
            }
        }

        return {taskList, isPay: rechargeAmount >= 6, finishTime, receive};
    }

    async getRechargePartyList(user) {
        const records = await RechargeParty.find().lean();
        const start = moment(new Date()).startOf('day').toDate()
        const end = moment(new Date()).endOf('day').toDate()
        let freeGift = {};
        const rechargeDay1 = [];
        const rechargeDay6 = [];
        const rechargeDay30 = [];
        const partyList1 = [];
        const partyList6 = [];
        const partyList30 = [];

        for (let i = 0; i < records.length; i++) {
            if (records[i].price === 0) {
                freeGift = records[i];
            }

            if (records[i].price === 1) {
                partyList1.push(records[i]);
            }

            if (records[i].price === 6) {
                partyList6.push(records[i]);
            }

            if (records[i].price === 30) {
                partyList30.push(records[i]);
            }
        }

        // 计算每日福利今日是否已领取
        const freeGiftReceiveCount = await PlayerRechargePartyRecord.count({
            playerId: user._id,
            prizeId: freeGift["_id"],
            createAt: {$gte: start, $lt: end}
        });
        freeGift["receive"] = freeGiftReceiveCount > 0;

        // 计算1元档
        // 计算今日是否已领取
        const party1TodayReceiveCount = await PlayerRechargePartyRecord.count({
            playerId: user._id,
            price: 1,
            createAt: {$gte: start, $lt: end}
        });
        for (let i = 0; i < partyList1.length; i++) {
            // 计算是否已领取
            const receiveCount = await PlayerRechargePartyRecord.count({
                playerId: user._id,
                prizeId: partyList1[i]._id
            });
            partyList1[i].receive = !!receiveCount;
        }

        // 计算6元档
        // 计算今日是否已领取
        const party6TodayReceiveCount = await PlayerRechargePartyRecord.count({
            playerId: user._id,
            price: 6,
            createAt: {$gte: start, $lt: end}
        });
        for (let i = 0; i < partyList6.length; i++) {
            // 计算是否已领取
            const receiveCount = await PlayerRechargePartyRecord.count({
                playerId: user._id,
                prizeId: partyList6[i]._id
            });
            partyList6[i].receive = !!receiveCount;
        }

        // 计算30元档
        // 计算今日是否已领取
        const party30TodayReceiveCount = await PlayerRechargePartyRecord.count({
            playerId: user._id,
            price: 30,
            createAt: {$gte: start, $lt: end}
        });
        for (let i = 0; i < partyList30.length; i++) {
            // 计算是否已领取
            const receiveCount = await PlayerRechargePartyRecord.count({
                playerId: user._id,
                prizeId: partyList30[i]._id
            });
            partyList30[i].receive = !!receiveCount;
        }

        // 用户今日充值金额
        const summary = await UserRechargeOrder.aggregate([
            {$match: {playerId: user._id.toString(), status: 1, created: {$gte: start, $lt: end}}},
            {$group: {_id: null, sum: {$sum: "$price"}}}
        ]).exec();
        let rechargeAmount = 0;
        if (summary.length > 0) {
            rechargeAmount = summary[0].sum;
        }

        // 计算连续充值天数
        for (let i = 0; i < 10; i++) {
            const todayTime = Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * i;
            const currentStart = moment(new Date(todayTime)).startOf('day').toDate();
            const currentEnd = moment(new Date(todayTime)).endOf('day').toDate();

            // 用户今日充值金额
            const summary = await UserRechargeOrder.aggregate([
                {$match: {playerId: user._id.toString(), status: 1, created: {$gte: currentStart, $lt: currentEnd}}},
                {$group: {_id: null, sum: {$sum: "$price"}}}
            ]).exec();
            let todayRechargeAmount = 0;
            if (summary.length > 0) {
                todayRechargeAmount = summary[0].sum;

                if (todayRechargeAmount >= 1) {
                    rechargeDay1.push(todayRechargeAmount);
                }

                if (todayRechargeAmount >= 6) {
                    rechargeDay6.push(todayRechargeAmount);
                }

                if (todayRechargeAmount >= 30) {
                    rechargeDay30.push(todayRechargeAmount);
                }
            }
        }

        return {
            freeGiftReceive: freeGift["receive"],
            partyOne: {
                todayFinish: rechargeAmount >= 1,
                todayReceive: party1TodayReceiveCount > 0,
                lists: partyList1,
                rechargeDay: rechargeDay1
            },
            partySix: {
                todayFinish: rechargeAmount >= 6,
                todayReceive: party6TodayReceiveCount > 0,
                lists: partyList6,
                rechargeDay: rechargeDay6
            },
            partyThirty: {
                todayFinish: rechargeAmount >= 30,
                todayReceive: party30TodayReceiveCount > 0,
                lists: partyList30,
                rechargeDay: rechargeDay30
            }
        }
    }

    async getDailyTaskData(user) {
        const taskLists = await this.getDailyTaskDataByType(user);
        let canReceive = this.checkDailyTaskReceive(taskLists);

        // 计算活跃度
        const liveness = await TaskRecord.aggregate([
            {$match: {playerId: user._id.toString()}},
            {$group: {_id: null, sum: {$sum: "$liveness"}}}
        ]).exec();
        let livenessCount = 0;
        if (liveness.length > 0) {
            livenessCount = liveness[0].sum;
        }

        // 获取累计活跃奖励列表
        const totalPrizeList = await TaskTotalPrize.find();
        const totalLists = [];

        for (let i = 0; i < totalPrizeList.length; i++) {
            const isReceive = await TaskTotalPrizeRecord.count({
                playerId: user._id.toString(),
                prizeId: totalPrizeList[i]._id
            });
            const data = {
                id: totalPrizeList[i].propId,
                type: totalPrizeList[i].type,
                count: totalPrizeList[i].number,
                liveness: totalPrizeList[i].liveness,
                prizeId: totalPrizeList[i]._id.toString(),
                receive: !!isReceive
            };

            // if (livenessCount >= data.liveness && !data.receive) {
            //   canReceive = true;
            // }

            totalLists.push(data);
        }

        return {canReceive, liveness: livenessCount};
    }

    async getDailyTaskDataByType(user) {
        let taskLists = [];

        // 成长成就
        // 富可敌国
        const developGetDiamond = await this.getAchievementTask(user, TaskType.developGetDiamond);
        if (developGetDiamond && developGetDiamond.taskId) taskLists.push(developGetDiamond);

        // 宴会大亨
        const developSignDay = await this.getAchievementTask(user, TaskType.developSignDay);
        if (developSignDay && developSignDay.taskId) taskLists.push(developSignDay);

        // 久经沙场
        const developTotalJuCount = await this.getAchievementTask(user, TaskType.developTotalJuCount);
        if (developTotalJuCount && developTotalJuCount.taskId) taskLists.push(developTotalJuCount);

        // 天道酬勤
        const developSimpleJuCount = await this.getAchievementTask(user, TaskType.developSimpleJuCount);
        if (developSimpleJuCount && developSimpleJuCount.taskId) taskLists.push(developSimpleJuCount);

        // 人生赢家
        const developGetGold = await this.getAchievementTask(user, TaskType.developGetGold);
        if (developGetGold && developGetGold.taskId) taskLists.push(developGetGold);

        // 收藏家
        const developCollect = await this.getAchievementTask(user, TaskType.developCollect);
        if (developCollect && developCollect.taskId) taskLists.push(developCollect);

        // 颜值担当
        const developAppearanceLevelPlay = await this.getAchievementTask(user, TaskType.developAppearanceLevelPlay);
        if (developAppearanceLevelPlay && developAppearanceLevelPlay.taskId) taskLists.push(developAppearanceLevelPlay);

        // 贵族气质
        const developNobility = await this.getAchievementTask(user, TaskType.developNobility);
        if (developNobility && developNobility.taskId) taskLists.push(developNobility);

        // 弄潮儿
        const developTide = await this.getAchievementTask(user, TaskType.developTide);
        if (developTide && developTide.taskId) taskLists.push(developTide);

        // 对局成就
        // 高处不胜寒
        const gameLonelyAtTheTop = await this.getAchievementTask(user, TaskType.gameLonelyAtTheTop);
        if (gameLonelyAtTheTop && gameLonelyAtTheTop.taskId) taskLists.push(gameLonelyAtTheTop);

        // 嘎嘎乱杀
        const gameQuackStrike = await this.getAchievementTask(user, TaskType.gameQuackStrike);
        if (gameQuackStrike && gameQuackStrike.taskId) taskLists.push(gameQuackStrike);

        // 禁止划水
        const gameNoStroke = await this.getAchievementTask(user, TaskType.gameNoStroke);
        if (gameNoStroke && gameNoStroke.taskId) taskLists.push(gameNoStroke);

        // 快枪手
        const gameTheMarksman = await this.getAchievementTask(user, TaskType.gameTheMarksman);
        if (gameTheMarksman && gameTheMarksman.taskId) taskLists.push(gameTheMarksman);

        // 疯狂屠夫
        const gameMadButcher = await this.getAchievementTask(user, TaskType.gameMadButcher);
        if (gameMadButcher && gameMadButcher.taskId) taskLists.push(gameMadButcher);

        // 回村的诱惑
        const gameGoVillage = await this.getAchievementTask(user, TaskType.gameGoVillage);
        if (gameGoVillage && gameGoVillage.taskId) taskLists.push(gameGoVillage);

        // 决胜千里
        const gameDecisiveVictory = await this.getAchievementTask(user, TaskType.gameDecisiveVictory);
        if (gameDecisiveVictory && gameDecisiveVictory.taskId) taskLists.push(gameDecisiveVictory);

        // 赛诸葛
        const gameSeszge = await this.getAchievementTask(user, TaskType.gameSeszge);
        if (gameSeszge && gameSeszge.taskId) taskLists.push(gameSeszge);

        // 散财童子
        const gameLooseMoneyBoy = await this.getAchievementTask(user, TaskType.gameLooseMoneyBoy);
        if (gameLooseMoneyBoy && gameLooseMoneyBoy.taskId) taskLists.push(gameLooseMoneyBoy);

        // 收割机器
        const gameReapingMachine = await this.getAchievementTask(user, TaskType.gameReapingMachine);
        if (gameReapingMachine && gameReapingMachine.taskId) taskLists.push(gameReapingMachine);

        // 玩法成就
        // 天选之人
        const gamePlayChosenOne = await this.getAchievementTask(user, TaskType.gamePlayChosenOne);
        if (gamePlayChosenOne && gamePlayChosenOne.taskId) taskLists.push(gamePlayChosenOne);

        // 潘达守护者
        const gamePlayPandan = await this.getAchievementTask(user, TaskType.gamePlayPandan);
        if (gamePlayPandan && gamePlayPandan.taskId) taskLists.push(gamePlayPandan);

        // 落地成盒
        const gamePlayBoxToBox = await this.getAchievementTask(user, TaskType.gamePlayBoxToBox);
        if (gamePlayBoxToBox && gamePlayBoxToBox.taskId) taskLists.push(gamePlayBoxToBox);

        // 春风得意
        const gamePlayTriumphant = await this.getAchievementTask(user, TaskType.gamePlayTriumphant);
        if (gamePlayTriumphant && gamePlayTriumphant.taskId) taskLists.push(gamePlayTriumphant);

        // 幸运之星
        const gamePlayLuckyStar = await this.getAchievementTask(user, TaskType.gamePlayLuckyStar);
        if (gamePlayLuckyStar && gamePlayLuckyStar.taskId) taskLists.push(gamePlayLuckyStar);

        // 人生如梦
        const gamePlayLifeIsDream = await this.getAchievementTask(user, TaskType.gamePlayLifeIsDream);
        if (gamePlayLifeIsDream && gamePlayLifeIsDream.taskId) taskLists.push(gamePlayLifeIsDream);

        // 玩法成就
        // 财富达人
        const specialFortuneMaster = await this.getAchievementTask(user, TaskType.specialFortuneMaster);
        if (specialFortuneMaster && specialFortuneMaster.taskId) taskLists.push(specialFortuneMaster);

        // 贵族专业户
        const specialAristocraticSpecialized = await this.getAchievementTask(user, TaskType.specialAristocraticSpecialized);
        if (specialAristocraticSpecialized && specialAristocraticSpecialized.taskId) taskLists.push(specialAristocraticSpecialized);

        // 豪气冲天
        const specialLoftyHeroic = await this.getAchievementTask(user, TaskType.specialLoftyHeroic);
        if (specialLoftyHeroic && specialLoftyHeroic.taskId) taskLists.push(specialLoftyHeroic);

        // 左右逢源
        const specialTurnTables = await this.getAchievementTask(user, TaskType.specialTurnTables);
        if (specialTurnTables && specialTurnTables.taskId) taskLists.push(specialTurnTables);

        return taskLists;
    }

    sortTasks(tasks) {
        const sortTasks = [];

        for (const task of tasks) {
            if (task.finish && !task.receive) {
                sortTasks.push(task);
            }
        }

        for (const task of tasks) {
            if (!task.finish) {
                sortTasks.push(task);
            }
        }

        for (const task of tasks) {
            if (task.finish && task.receive) {
                sortTasks.push(task);
            }
        }

        return sortTasks;
    }

    checkDailyTaskReceive(tasks) {
        let canReceive = false;

        for (const task of tasks) {
            if (task.finish && !task.receive) {
                canReceive = true;
                break;
            }
        }

        return canReceive;
    }

    async getAchievementTask(user, typeId) {
        let task = null;
        const tasks = await Task.find({typeId}).lean();

        for (let i = 0; i < tasks.length; i++) {
            const taskInfo = await this.checkTaskFinishAndReceive(tasks[i], user);
            if (!taskInfo.finish || (taskInfo.finish && !taskInfo.receive)) {
                task = taskInfo;
                break;
            }
        }

        return task;
    }

    async checkTaskFinishAndReceive(task, user) {
        // 富可敌国
        if (task.typeId === TaskType.developGetDiamond) {
            task.finish = user.diamond >= task.taskTimes;
            task.finishCount = user.diamond >= task.taskTimes ? task.taskTimes : user.diamond;
        }

        // 宴会大亨
        if (task.typeId === TaskType.developSignDay) {
            task.finish = user.totalSignLoginDays >= task.taskTimes;
            task.finishCount = user.totalSignLoginDays >= task.taskTimes ? task.taskTimes : user.totalSignLoginDays;
        }

        // 久经沙场
        if (task.typeId === TaskType.developTotalJuCount) {
            const juCount = await RoomScoreRecord.count({
                creatorId: user.shortId
            });
            task.finish = juCount >= task.taskTimes;
            task.finishCount = juCount >= task.taskTimes ? task.taskTimes : juCount;
        }

        // 天道酬勤
        if (task.typeId === TaskType.developSimpleJuCount) {
            const start = moment(new Date()).startOf('day').toDate()
            const end = moment(new Date()).endOf('day').toDate()
            const juCount = await RoomScoreRecord.count({
                creatorId: user.shortId,
                createAt: {$gte: start, $lt: end}
            });
            task.finish = juCount >= task.taskTimes;
            task.finishCount = juCount >= task.taskTimes ? task.taskTimes : juCount;
        }

        // 人生赢家
        if (task.typeId === TaskType.developGetGold) {
            task.finish = user.gold >= task.taskTimes;
            task.finishCount = user.gold >= task.taskTimes ? task.taskTimes : user.gold;
        }

        // 收藏家
        if (task.typeId === TaskType.developCollect) {
            const playerCardTableCount = await PlayerCardTable.count({
                playerId: user._id,
                times: -1,
                propId: {$ne: 1200}
            });
            task.finish = playerCardTableCount >= task.taskTimes;
            task.finishCount = playerCardTableCount >= task.taskTimes ? task.taskTimes : playerCardTableCount;
        }

        // 颜值担当
        if (task.typeId === TaskType.developAppearanceLevelPlay) {
            const playerHeadBorderCount = await PlayerHeadBorder.count({
                playerId: user._id,
                times: -1,
                propId: {$ne: 1000}
            });
            task.finish = playerHeadBorderCount >= task.taskTimes;
            task.finishCount = playerHeadBorderCount >= task.taskTimes ? task.taskTimes : playerHeadBorderCount;
        }

        // 贵族气质
        if (task.typeId === TaskType.developNobility) {
            task.finish = user.vip >= task.taskTimes;
            task.finishCount = user.vip >= task.taskTimes ? task.taskTimes : user.vip;
        }

        // 弄潮儿
        if (task.typeId === TaskType.developTide) {
            const playerMedalCount = await PlayerMedal.count({playerId: user._id, times: -1});
            task.finish = playerMedalCount >= task.taskTimes;
            task.finishCount = playerMedalCount >= task.taskTimes ? task.taskTimes : playerMedalCount;
        }

        // 高处不胜寒
        if (task.typeId === TaskType.gameLonelyAtTheTop) {
            task.finish = user.atTheTopCount >= task.taskTimes;
            task.finishCount = user.atTheTopCount >= task.taskTimes ? task.taskTimes : user.atTheTopCount;
        }

        // 嘎嘎乱杀
        if (task.typeId === TaskType.gameQuackStrike) {
            task.finish = user.quackStrikeCount >= task.taskTimes;
            task.finishCount = user.quackStrikeCount >= task.taskTimes ? task.taskTimes : user.quackStrikeCount;
        }

        // 禁止划水
        if (task.typeId === TaskType.gameNoStroke) {
            task.finish = user.noStrokeCount >= task.taskTimes;
            task.finishCount = user.noStrokeCount >= task.taskTimes ? task.taskTimes : user.noStrokeCount;
        }

        // 快枪手
        if (task.typeId === TaskType.gameTheMarksman) {
            task.finish = user.theMarksmanCount >= task.taskTimes;
            task.finishCount = user.theMarksmanCount >= task.taskTimes ? task.taskTimes : user.theMarksmanCount;
        }

        // 疯狂屠夫
        if (task.typeId === TaskType.gameMadButcher) {
            task.finish = user.madButcherCount >= task.taskTimes;
            task.finishCount = user.madButcherCount >= task.taskTimes ? task.taskTimes : user.madButcherCount;
        }

        // 回村的诱惑
        if (task.typeId === TaskType.gameGoVillage) {
            task.finish = user.goVillageCount >= task.taskTimes;
            task.finishCount = user.goVillageCount >= task.taskTimes ? task.taskTimes : user.goVillageCount;
        }

        // 决胜千里
        if (task.typeId === TaskType.gameDecisiveVictory) {
            task.finish = user.juWinCount >= task.taskTimes;
            task.finishCount = user.juWinCount >= task.taskTimes ? task.taskTimes : user.juWinCount;
        }

        // 赛诸葛
        if (task.typeId === TaskType.gameSeszge) {
            task.finish = user.juContinueWinCount >= task.taskTimes;
            task.finishCount = user.juContinueWinCount >= task.taskTimes ? task.taskTimes : user.juContinueWinCount;
        }

        // 散财童子
        if (task.typeId === TaskType.gameLooseMoneyBoy) {
            task.finish = user.looseMoneyBoyAmount >= task.taskTimes;
            task.finishCount = user.looseMoneyBoyAmount >= task.taskTimes ? task.taskTimes : user.looseMoneyBoyAmount;
        }

        // 收割机器
        if (task.typeId === TaskType.gameReapingMachine) {
            task.finish = user.reapingMachineAmount >= task.taskTimes;
            task.finishCount = user.reapingMachineAmount >= task.taskTimes ? task.taskTimes : user.reapingMachineAmount;
        }

        // 天选之人
        if (task.typeId === TaskType.gamePlayChosenOne) {
            task.finish = user.chosenOneCount >= task.taskTimes;
            task.finishCount = user.chosenOneCount >= task.taskTimes ? task.taskTimes : user.chosenOneCount;
        }

        // 潘达守护者
        if (task.typeId === TaskType.gamePlayPandan) {
            task.finish = user.pandanCount >= task.taskTimes;
            task.finishCount = user.pandanCount >= task.taskTimes ? task.taskTimes : user.pandanCount;
        }

        // 落地成盒
        if (task.typeId === TaskType.gamePlayBoxToBox) {
            task.finish = user.boxToBoxCount >= task.taskTimes;
            task.finishCount = user.boxToBoxCount >= task.taskTimes ? task.taskTimes : user.boxToBoxCount;
        }

        // 春风得意
        if (task.typeId === TaskType.gamePlayTriumphant) {
            task.finish = user.triumphantCount >= task.taskTimes;
            task.finishCount = user.triumphantCount >= task.taskTimes ? task.taskTimes : user.triumphantCount;
        }

        // 幸运之星
        if (task.typeId === TaskType.gamePlayLuckyStar) {
            task.finish = user.luckyStarCount >= task.taskTimes;
            task.finishCount = user.luckyStarCount >= task.taskTimes ? task.taskTimes : user.luckyStarCount;
        }

        // 人生如梦
        if (task.typeId === TaskType.gamePlayLifeIsDream) {
            task.finish = user.lifeIsDreamCount >= task.taskTimes;
            task.finishCount = user.lifeIsDreamCount >= task.taskTimes ? task.taskTimes : user.lifeIsDreamCount;
        }

        // 财富达人
        if (task.typeId === TaskType.specialFortuneMaster) {
            const recordCount = await DiamondRecord.count({player: user._id, type: ConsumeLogType.gemForRuby});
            task.finish = recordCount >= task.taskTimes;
            task.finishCount = recordCount >= task.taskTimes ? task.taskTimes : recordCount;
        }

        // 贵族专业户
        if (task.typeId === TaskType.specialAristocraticSpecialized) {
            task.finish = user.payVipCount >= task.taskTimes;
            task.finishCount = user.payVipCount >= task.taskTimes ? task.taskTimes : user.payVipCount;
        }

        // 豪气冲天
        if (task.typeId === TaskType.specialLoftyHeroic) {
            task.finish = user.loftyHeroicCount >= task.taskTimes;
            task.finishCount = user.loftyHeroicCount >= task.taskTimes ? task.taskTimes : user.loftyHeroicCount;
        }

        // 左右逢源
        if (task.typeId === TaskType.specialTurnTables) {
            task.finish = user.shopFreeGiftCount >= task.taskTimes;
            task.finishCount = user.shopFreeGiftCount >= task.taskTimes ? task.taskTimes : user.shopFreeGiftCount;
        }

        const isReceive = await TaskRecord.count({playerId: user._id.toString(), taskId: task.taskId});
        task.receive = !!isReceive;

        // 任务描述用finishCount替换?
        // task.taskDescribe = task.taskDescribe.replace("?", task.finishCount);

        return task;
    }

    async playerPaySupplement(orderId, thirdOrderNo) {
        const order = await PlayerPayDailySupplementRecord.findOne({_id: orderId});
        if (!order) {
            return false;
        }

        const user = await Player.findOne({_id: order.playerId});
        if (!user) {
            return false;
        }

        user.tlGold += order.config.gold;
        await user.save();

        order.status = 1;
        order.transactionId = thirdOrderNo;
        await order.save();

        // 增加日志
        await this.logGoldConsume(user._id, ConsumeLogType.payDailySupplement, order.config.gold, user.tlGold, "购买复活专享补充包");

        return true;
    }
}
