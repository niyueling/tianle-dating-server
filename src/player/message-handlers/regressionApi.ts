import {TianleErrorCode, ConsumeLogType} from "@fm/common/constants";
import {addApi, BaseApi} from "./baseApi";
import * as moment from "moment";
import {service} from "../../service/importService";
import Player from "../../database/models/player";
import HeadBorder from "../../database/models/HeadBorder";
import PlayerHeadBorder from "../../database/models/PlayerHeadBorder";
import Medal from "../../database/models/Medal";
import PlayerMedal from "../../database/models/PlayerMedal";
import NewTask from "../../database/models/newTask";
import NewTaskRecord from "../../database/models/NewTaskRecord";
import DiamondRecord from "../../database/models/diamondRecord";
import UserRechargeOrder from "../../database/models/userRechargeOrder";
import NewFirstRecharge from "../../database/models/NewFirstRecharge";
import NewFirstRechargeRecord from "../../database/models/NewFirstRechargeRecord";
import CardTable from "../../database/models/CardTable";
import PlayerCardTable from "../../database/models/PlayerCardTable";
import RechargeParty from "../../database/models/RechargeParty";
import PlayerRechargePartyRecord from "../../database/models/PlayerRechargePartyRecord";
import RegressionSignPrize from "../../database/models/RegressionSignPrize";
import RegressionSignPrizeRecord from "../../database/models/RegressionSignPrizeRecord";
import RegressionRechargeRecord from "../../database/models/RegressionRechargeRecord";
import crypto = require('crypto');
import * as config from '../../config'

export class RegressionApi extends BaseApi {
    // 回归签到
    @addApi()
    async signLists() {
        const user = await this.service.playerService.getPlayerModel(this.player.model._id);

        if (!user) {
            return this.replyFail(TianleErrorCode.userNotFound);
        }

        const data = await this.getRegressionSignLists(user);

        return this.replySuccess(data);
    }

    // 购买回归签到礼包
    @addApi()
    async payRechargeGift(message) {
        const env = message.env || 0;
        // 获取奖励配置
        const player = await service.playerService.getPlayerModel(this.player._id);
        if (!player) {
            return this.replyFail(TianleErrorCode.userNotFound);
        }
        if (!player.openid) {
            return this.replyFail(TianleErrorCode.openidNotFound);
        }
        if (!player.sessionKey) {
            return this.replyFail(TianleErrorCode.sessionKeyNotFound);
        }

        const startTime = player.regressionTime || new Date();
        const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);
        const start = moment(startTime).startOf('day').toDate()
        const end = moment(endTime).endOf('day').toDate()

        // 判断是否已经购买
        const receive = await RegressionRechargeRecord.findOne({
            playerId: this.player._id,
            status: 1,
            createAt: {$gte: start, $lt: end}
        });
        if (receive) {
            return this.replyFail(TianleErrorCode.orderNotExistOrPay);
        }

        // 创建购买记录
        const data = {
            playerId: this.player._id.toString(),
            amount: config.game.regressionAmount,
            status: 0,
            sn: await this.service.utils.generateOrderNumber()
        };

        const record = await RegressionRechargeRecord.create(data);
        const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
        const appKey = await this.service.utils.getGlobalConfigByName("appkey");
        const userPostBody = {
            openid: player.openid,
            offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
            ts: Math.floor(Date.now() / 1000),
            zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
            env: env,
            user_ip: this.player.getIpAddress()
        }

        const userPostBodyString = JSON.stringify(userPostBody);

        // 生成登录态签名和支付请求签名
        const signature = crypto.createHmac('sha256', player.sessionKey).update(userPostBodyString).digest('hex');
        const needSignMsg = `/wxa/game/getbalance&${userPostBodyString}`;
        const paySign = crypto.createHmac('sha256', appKey).update(needSignMsg).digest('hex');

        // 查询用户游戏币余额
        const balanceUrl = `https://api.weixin.qq.com/wxa/game/getbalance?access_token=${accessToken}&signature=${signature}&sig_method=hmac_sha256&pay_sig=${paySign}`;
        const response = await this.service.base.postByJson(balanceUrl, userPostBody);
        if (response.data.errcode !== 0) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        // 如果用户游戏币小于充值数量，通知客户端充值，operate=1
        if (response.data.balance < config.game.regressionAmount * 10) {
            return this.replySuccess({
                "orderId": record["_id"],
                'orderSn': record["sn"],
                "env": env,
                "offerId": userPostBody.offer_id,
                'zoneId': userPostBody.zone_id,
                "currencyType": "CNY",
                "buyQuantity": config.game.regressionAmount * 10,
                "operate": 1
            })
        }

        // 如果用户游戏币大于充值数量，扣除游戏币
        const payBody = {
            openid: player.openid,
            offer_id: userPostBody.offer_id,
            ts: userPostBody.ts,
            zone_id: userPostBody.zone_id,
            env: userPostBody.env,
            user_ip: userPostBody.user_ip,
            amount: config.game.regressionAmount * 10,
            bill_no: record.sn
        }

        // 生成登录态签名和支付请求签名
        const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
        const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
        const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
        const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
        const pay_res = await this.service.base.curl(payUrl, { method: "post", data: payBody});
        const pay_response = JSON.parse(pay_res.data);
        if (pay_response.errcode !== 0) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        // 虚拟币支付成功，直接购买完成
        const result = this.service.playerService.playerPayRegressionSignGift(record._id, pay_response.bill_no);
        if(!result) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        pay_response.operate = 2;

        return this.replySuccess(pay_response);
    }

    // 安卓虚拟支付回调
    @addApi()
    async wxPayRechargeGiftNotify(message) {
        const env = message.env || 0;
        const order = await RegressionRechargeRecord.findOne({_id: message.orderId});
        if (!order || order.status === 1) {
            return this.replyFail(TianleErrorCode.orderNotExistOrPay);
        }

        const player = await service.playerService.getPlayerModel(order.playerId);
        if (!player || !player.openid || !player.sessionKey) {
            return this.replyFail(TianleErrorCode.userNotFound);
        }

        const accessToken = await this.service.utils.getGlobalConfigByName("MnpAccessToken");
        const appKey = await this.service.utils.getGlobalConfigByName("appkey");
        const userPostBody = {
            openid: player.openid,
            offer_id: await this.service.utils.getGlobalConfigByName("offerid"),
            ts: Math.floor(Date.now() / 1000),
            zone_id: await this.service.utils.getGlobalConfigByName("zoneid"),
            env: env,
            user_ip: this.player.getIpAddress()
        }
        const userPostBodyString = JSON.stringify(userPostBody);

        // 生成登录态签名和支付请求签名
        const signature = crypto.createHmac('sha256', player.sessionKey).update(userPostBodyString).digest('hex');
        const needSignMsg = `/wxa/game/getbalance&${userPostBodyString}`;
        const paySign = crypto.createHmac('sha256', appKey).update(needSignMsg).digest('hex');
        // 查询用户游戏币余额
        const balanceUrl = `https://api.weixin.qq.com/wxa/game/getbalance?access_token=${accessToken}&signature=${signature}&sig_method=hmac_sha256&pay_sig=${paySign}`;
        const response = await this.service.base.postByJson(balanceUrl, userPostBody);
        if (response.data.errcode !== 0) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        if (response.data.balance < config.game.regressionAmount * 10) {
            return this.replyFail(TianleErrorCode.gameBillInsufficient);
        }

        // 如果用户游戏币大于充值数量，扣除游戏币
        const payBody = {
            openid: player.openid,
            offer_id: userPostBody.offer_id,
            ts: userPostBody.ts,
            zone_id: userPostBody.zone_id,
            env: userPostBody.env,
            user_ip: userPostBody.user_ip,
            amount: config.game.regressionAmount * 10,
            bill_no: order._id
        }

        // 生成登录态签名和支付请求签名
        const sign = crypto.createHmac('sha256', player.sessionKey).update(JSON.stringify(payBody)).digest('hex');
        const needSign = "/wxa/game/pay&" + JSON.stringify(payBody);
        const paySig = crypto.createHmac('sha256', appKey).update(needSign).digest('hex');
        const payUrl = `https://api.weixin.qq.com/wxa/game/pay?access_token=${accessToken}&signature=${sign}&sig_method=hmac_sha256&pay_sig=${paySig}`;
        const pay_response = await this.service.base.postByJson(payUrl, payBody);
        if (pay_response.data.errcode !== 0) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        const result = await this.service.playerService.playerPayRegressionSignGift(order._id, pay_response.data.bill_no);
        if(!result) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        this.replySuccess(order);
    }

    // 领取回归签到奖励
    @addApi({
        rule: {
            prizeId: 'string',
        }
    })
    async signIn(message) {
        const player = await service.playerService.getPlayerModel(this.player._id);

        const startTime = player.regressionTime;
        const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);

        // 判断是否已经购买
        const payCount = await RegressionRechargeRecord.count({
            playerId: player._id,
            status: 1,
            createAt: {$gte: startTime, $lt: endTime}
        });
        if (!payCount) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        // 获取奖励配置
        const prizeInfo = await RegressionSignPrize.findOne({_id: message.prizeId});
        if (!prizeInfo) {
            return this.replyFail(TianleErrorCode.configNotFound);
        }

        // 判断是否领取
        let receiveInfo = await RegressionSignPrizeRecord.findOne({playerId: this.player._id, day: prizeInfo.day});
        // 如果今日免费奖品已领取，不能重复领取
        if (receiveInfo && receiveInfo.freeReceive && message.type === 1) {
            return this.replyFail(TianleErrorCode.prizeIsReceive);
        }
        // 如果今日付费奖品已领取，不能重复领取
        if (receiveInfo && receiveInfo.payReceive && message.type === 2) {
            return this.replyFail(TianleErrorCode.prizeIsReceive);
        }

        // 领取免费奖品
        if (message.type === 1) {
            if (receiveInfo) {
                receiveInfo.freeReceive = true;
            }

            for (let i = 0; i < prizeInfo.freePrizeList.length; i++) {
                await this.receivePrize(prizeInfo.freePrizeList[i], this.player._id, 1, ConsumeLogType.payRegressionSignGift);
            }
        }

        // 领取付费奖品
        if (message.type === 2) {
            if (receiveInfo) {
                receiveInfo.payReceive = true;
            }

            for (let i = 0; i < prizeInfo.payPrizeList.length; i++) {
                await this.receivePrize(prizeInfo.payPrizeList[i], this.player._id, 1, ConsumeLogType.payRegressionSignGift);
            }
        }

        if (receiveInfo) {
            await receiveInfo.save();
        } else {
            // 创建领取记录
            const data = {
                playerId: this.player._id,
                prizeId: prizeInfo._id,
                day: prizeInfo.day,
                freeReceive: message.type === 1,
                payReceive: message.type === 2,
                prizeConfig: prizeInfo
            };

            receiveInfo = await RegressionSignPrizeRecord.create(data);
        }


        await this.player.updateResource2Client();
        return this.replySuccess(receiveInfo);
    }

    // 一键领取新手签到
    @addApi()
    async oneTouchSignIn() {
        const user = await this.service.playerService.getPlayerModel(this.player.model._id);

        if (!user) {
            return this.replyFail(TianleErrorCode.userNotFound);
        }

        const player = await service.playerService.getPlayerModel(this.player._id);

        const startTime = player.regressionTime;
        const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);

        // 判断是否已经购买
        const payCount = await RegressionRechargeRecord.count({
            playerId: player._id,
            status: 1,
            createAt: {$gte: startTime, $lt: endTime}
        });
        if (!payCount) {
            return this.replyFail(TianleErrorCode.payFail);
        }

        let days = 0;


        let lastReceiveInfo = await RegressionSignPrizeRecord.find({playerId: user._id}).sort({createAt: -1}).limit(1);
        // 如果没有领取记录，则可以领取第一天的数据
        if (!lastReceiveInfo.length) {
            days = 1;
        }
        const todayStart = moment(new Date()).startOf('day').toDate().toString();
        // 最后一次领取时间是今天之前，则可领取天数+1
        if (lastReceiveInfo.length > 0 && Date.parse(lastReceiveInfo.createAt) < Date.parse(todayStart)) {
            days++;
        }
        const receiveFreeDatas = [];
        const receivePayDatas = [];

        for (let i = 1; i <= days; i++) {
            const receiveResult = await this.onceReceive(days[i]);
            if (receiveResult) {
                receiveFreeDatas.push(receiveResult.freePrizeList);
                receivePayDatas.push(receiveResult.payPrizeList);
            }
        }

        return this.replySuccess({receiveFreeDatas, receivePayDatas});
    }

    async onceReceive(day) {
        // 获取奖励配置
        const prizeInfo = await RegressionSignPrize.findOne({day});
        if (!prizeInfo) {
            return false;
        }

        let freePrizeList = [];
        let payPrizeList = [];

        // 判断是否领取
        let receiveInfo = await RegressionSignPrizeRecord.findOne({playerId: this.player._id, day: prizeInfo.day});
        if (receiveInfo && receiveInfo.freeReceive && receiveInfo.payReceive) {
            return false;
        }

        // 领取免费奖品
        if (!receiveInfo || (receiveInfo && !receiveInfo.freeReceive)) {
            if (receiveInfo) {
                receiveInfo.freeReceive = true;
            }

            freePrizeList = [...freePrizeList, ...prizeInfo.freePrizeList];

            for (let i = 0; i < prizeInfo.freePrizeList.length; i++) {
                await this.receivePrize(prizeInfo.freePrizeList[i], this.player._id, 1, ConsumeLogType.payRegressionSignGift);
            }
        }

        // 领取付费奖品
        if (!receiveInfo || (receiveInfo && !receiveInfo.payReceive)) {
            if (receiveInfo) {
                receiveInfo.payReceive = true;
            }

            payPrizeList = [...payPrizeList, ...prizeInfo.payPrizeList];

            for (let i = 0; i < prizeInfo.payPrizeList.length; i++) {
                await this.receivePrize(prizeInfo.payPrizeList[i], this.player._id, 1, ConsumeLogType.payRegressionSignGift);
            }
        }

        if (receiveInfo) {
            await receiveInfo.save();
        } else {
            // 创建领取记录
            const data = {
                playerId: this.player._id,
                prizeId: prizeInfo._id,
                day: prizeInfo.day,
                freeReceive: true,
                payReceive: true,
                prizeConfig: prizeInfo
            };

            await RegressionSignPrizeRecord.create(data);
        }

        return {payPrizeList, freePrizeList};
    }

    async getRegressionSignLists(user) {
        const prizeList = await RegressionSignPrize.find().sort({day: 1}).lean();
        const start = moment(new Date()).startOf('day').toDate()
        const end = moment(new Date()).endOf('day').toDate()
        const isTodaySign = await RegressionSignPrizeRecord.count({
            playerId: user._id,
            createAt: {$gte: start, $lt: end}
        });
        const startTime = user.regressionTime || new Date();
        const endTime = new Date(Date.parse(startTime) + 1000 * 60 * 60 * 24 * 10);
        let days = await RegressionSignPrizeRecord.count({playerId: user._id});
        if (!isTodaySign) {
            days++;
        }

        // 判断是否已经购买
        const isPay = await RegressionRechargeRecord.findOne({
            playerId: user._id,
            status: 1,
            createAt: {$gte: startTime, $lt: endTime}
        });

        for (let i = 0; i < prizeList.length; i++) {
            const receive = await RegressionSignPrizeRecord.count({playerId: user._id, day: prizeList[i].day});
            prizeList[i].receive = !!receive;
        }

        return {isPay: !!isPay, isTodaySign: !!isTodaySign, days, prizeList, activityTimes: {startTime, endTime}};
    }

    async receivePrize(prize, playerId, multiple = 1, type) {
        const user = await Player.findOne({_id: playerId});
        if (prize.type === 1) {
            user.diamond += prize.number * multiple;
            await service.playerService.logGemConsume(user._id, type, prize.number * multiple,
                user.diamond, `新手签到获得${prize.number * multiple}钻石`);
        }

        if (prize.type === 2) {
            user.gold += prize.number * multiple;
            await service.playerService.logGoldConsume(user._id, type, prize.number * multiple,
                user.gold, `新手签到获得${prize.number * multiple}金豆`);
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
                    times: -1,
                    isUse: false
                }

                await PlayerHeadBorder.create(data);
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
                await playerCardTable.remove({_id: playerCardTable._id});
                playerCardTable = null;
            }

            if (config && !playerCardTable) {
                const data = {
                    propId: prize.propId,
                    playerId: user._id,
                    shortId: user.shortId,
                    times: -1,
                    isUse: false
                }

                await PlayerCardTable.create(data);
            }
        }

        await user.save();
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

        // 获取活动时间
        const startTime = user.createAt;
        const endTime = new Date(Date.parse(user.createAt) + 1000 * 60 * 60 * 24 * 10);

        return {
            freeGift,
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
            },
            activityTime: {startTime, endTime}
        };
    }
}
