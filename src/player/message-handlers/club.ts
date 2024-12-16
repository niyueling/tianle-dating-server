import {ConsumeLogType, TianleErrorCode} from "@fm/common/constants";
import * as logger from 'winston';
import Club from '../../database/models/club'
import ClubExtra from '../../database/models/clubExtra';
import {logRename, logTransfer} from "../../database/models/clubLog";
import ClubMember from '../../database/models/clubMember'
import ClubRequest from '../../database/models/clubRequest'
import {ClubRuleModel, createClubRule, RuleType} from "../../database/models/clubRule";
import GameRecord from '../../database/models/gameRecord'
import {MailModel, MailState, MailType} from "../../database/models/mail";
import PlayerModel from '../../database/models/player'
import RoomRecord from '../../database/models/roomRecord'
import {service} from "../../service/importService";
import GlobalConfig from "../../database/models/globalConfig";
import {createClient} from "../../utils/redis";

function lobbyQueueNameFrom(gameType: string) {
    return `${gameType}Lobby`
}

// 操作战队
export const enum ClubAction {
    // 改名
    rename = 'club/rename',
    // 转移俱乐部
    transfer = 'club/transfer',
    // 编辑规则
    editRule = 'club/editRule',
    // 创建规则
    addRule = 'club/addRule',
    // 删除规则
    deleteRule = 'club/deleteRule',
}

export async function getPlayerClub(playerId, clubId?: string) {
    let clubMemberInfo;
    if (clubId) {
        clubMemberInfo = await ClubMember.findOne({member: playerId, club: clubId})
    } else {
        clubMemberInfo = await ClubMember.findOne({member: playerId})
    }

    if (!clubMemberInfo) {
        const ownerClub = await Club.findOne({owner: playerId});
        if (ownerClub) {
            return ownerClub;
        }
        return false
    }
    return await Club.findOne({_id: clubMemberInfo.club}).lean();
}

export async function getPlayerJoinClub(playerId) {
    let clubMemberInfo = await ClubMember.find({member: playerId});
    const shortIds = [];

    for (let i = 0; i < clubMemberInfo.length; i++) {
        const clubInfo = await Club.findOne({_id: clubMemberInfo[i].club}).lean();
        shortIds.push(clubInfo.shortId);
    }

    return shortIds;
}

async function getOwnerClub(playerId, clubShortId) {
    const ownerClub = await Club.findOne({owner: playerId, shortId: clubShortId});
    if (ownerClub) {
        return ownerClub;
    }
    return false
}

async function getClubExtra(clubId) {
    let clubExtra = await ClubExtra.findOne({clubId});
    if (!clubExtra) {
        clubExtra = await ClubExtra.create({
            clubId
        })
    }
    return clubExtra
}

async function getClubRooms(clubId) {
    let clubRooms = [];
    const redis = createClient();
    const roomNumbers = await redis.smembersAsync('clubRoom:' + clubId);
    const roomInfoKeys = roomNumbers.map(num => 'room:info:' + num);
    let roomDatas = [];
    if (roomInfoKeys.length > 0) {
        roomDatas = await redis.mgetAsync(roomInfoKeys);
    }

    for (const roomData of roomDatas) {
        const roomInfo = JSON.parse(roomData);
        if (roomInfo) {
            const rule = roomInfo.gameRule || 'err';
            const roomNum = roomInfo._id || 'err';
            const roomCreator = roomInfo.creatorName || 'err';
            const playerOnline = roomInfo.players.filter(x => x).length + roomInfo.disconnected.length;
            const juIndex = roomInfo.game.juIndex;

            clubRooms.push({roomNum, roomCreator, rule, playerOnline, juIndex});
        }
    }

    return clubRooms.sort((x, y) => {
        if (Math.max(x.playerOnline, y.playerOnline) < 4) {
            return y.playerOnline - x.playerOnline
        } else {
            return x.playerOnline - y.playerOnline
        }

    })
}

async function playerInClub(clubShortId: string, playerId: string) {
    if (!clubShortId) {
        return false;
    }
    const club = await Club.findOne({shortId: clubShortId});
    if (!club) {
        return false;
    }

    if (club.owner === playerId) {
        return true;
    }

    return ClubMember.findOne({club: club._id, member: playerId}).exec();
}

export async function playerInClubBlacklist(clubId, gameType, playerId) {
    const clubExtra = await getClubExtra(clubId)
    const clubBlacklist = clubExtra && clubExtra.blacklist || []
    return clubBlacklist.find(x => x === playerId)
}

// 创建俱乐部房间
async function createClubRoom(player, message) {
    if (!await playerInClub(message.clubShortId, player._id)) {
        player.sendMessage('room/join-fail', {reason: '您不是该战队成员'});
        return
    }

    const club = await Club.findOne({shortId: message.clubShortId, gameType: message.gameType})
    if (!club) {
        player.sendMessage('room/join-fail', {reason: '战队房错误。'});
        return
    }
    if (club.state === 'off') {
        player.sendMessage('room/join-fail', {reason: '该战队创建房间功能被圈主暂停，详情请联系圈主'});
        return
    }
    const playerInBlacklist = await playerInClubBlacklist(club._id, message.gameType, player._id)
    if (playerInBlacklist) {
        player.sendMessage('room/join-fail', {reason: `您暂时不能参与游戏，详情咨询圈主或管理员！`});
        return
    }
    const rule = message.rule

    if (club.lockedRule && club.lockedRule.jokerCount && club.lockedRule.jokerCount === rule.jokerCount) {
        player.sendMessage('room/join-fail', {reason: '房间限制规则已改变，无法创建带有' + rule.jokerCount + '王的游戏！'});
        return
    }

    if (rule.useClubGold) {
        /*
        if(club.owner ==  player._id) {
          player.sendMessage('room/join-fail', { reason: '战队主无法游玩本战队金币场房间' });
          return
        }*/
        rule.useClubGold = true;
        const clubMember = await ClubMember.findOne({club: club._id, member: player._id})
        if (clubMember.clubGold < rule.leastGold) {
            player.sendMessage('room/join-fail', {reason: '您的金币不足'});
            return;
        }
    }

    const gameType = rule.type || 'paodekuai'
    player.setGameName(message.gameType)
    player.requestTo(lobbyQueueNameFrom(gameType), 'createClubRoom', {rule, clubId: club._id})
}

export async function requestToAllClubMember(channel, name, clubId, info) {

    const club = await Club.findOne({_id: clubId});

    if (!club) {
        return
    }

    channel.publish(
        `exClubCenter`,
        `club:${clubId}`,
        toBuffer({name, payload: info}))
}

function toBuffer(messageJson) {
    return new Buffer(JSON.stringify(messageJson))
}

export async function playerIsAdmin(playerId, clubShortId) {
    const club = await Club.findOne({shortId: clubShortId})
    if (!club) {
        return false
    }
    const clubMemberInfo = await ClubMember.findOne({member: playerId, club: club._id})

    if (clubMemberInfo) {
        return clubMemberInfo.role === 'admin'
    }
    return false
}

export default {
    'club/request': async (player, message) => {
        const alreadyJoinedClubs = await ClubMember.count({member: player.model._id}).lean()

        if (alreadyJoinedClubs >= 5) {
            player.sendMessage('club/requestReply', {ok: false, info: TianleErrorCode.joinMaxClub});
            return
        }

        const clubRequest = await ClubRequest.findOne({
            playerId: player.model._id,
            clubShortId: message.clubShortId
        });
        if (clubRequest) {
            player.sendMessage('club/requestReply', {ok: false, info: TianleErrorCode.alreadyApplyClub});
            return
        }

        const haveThisClub = await Club.findOne({shortId: message.clubShortId})
        if (!haveThisClub) {
            player.sendMessage('club/requestReply', {ok: false, info: TianleErrorCode.clubNotExists});
            return
        }

        const clubMember = await ClubMember.findOne({
            club: haveThisClub._id,
            member: player.model._id
        });

        if (clubMember) {
            player.sendMessage('club/requestReply', {ok: false, info: TianleErrorCode.alreadyJoinClub});
            return
        }

        await requestToAllClubMember(player.channel, 'clubRequest', haveThisClub._id, {})

        await ClubRequest.create({
            playerId: player.model._id,
            clubShortId: message.clubShortId,
            avatar: player.model.avatar,
            playerShortId: player.model.shortId,
            playerName: player.model.nickname,
        });

        player.sendMessage('club/requestReply', {ok: true, data: {}});
    },
    'club/create': createClubRoom,
    'club/getClubInfo': async (player, message) => {
        const tempClub = await Club.findOne({shortId: message.clubShortId});
        const clubId = tempClub ? tempClub._id.toString() : '';

        const playerClub = await getPlayerClub(player.model._id, clubId);
        if (!playerClub) {
            player.sendMessage('club/getClubInfoReply', {ok: false, info: TianleErrorCode.notClubPlayer});
            return;
        }

        const allClubMemberShips = await ClubMember.find({member: player.model._id}).populate('club').lean();

        const clubs = allClubMemberShips.map(cm => cm.club);

        const room = await getClubRooms(playerClub._id);
        const currentClubMemberShip = allClubMemberShips.find(x => x.club._id.toString() === clubId);

        const isAdmin = currentClubMemberShip && currentClubMemberShip.role === 'admin';

        const clubOwnerId = playerClub.owner;
        const clubOwner = await PlayerModel.findOne({_id: clubOwnerId}).sort({nickname: 1})

        const currentClubPlayerGold = currentClubMemberShip && currentClubMemberShip.clubGold || 0;
        const clubRule = await getClubRule(playerClub);
        const clubInfo = {
            diamond: clubOwner.diamond,
            name: clubOwner.nickname,
            clubGold: currentClubPlayerGold,
            clubName: playerClub.name,
            clubShortId: playerClub.shortId,
            publicRule: clubRule.publicRule
        }

        // await player.listenClub(playerClub._id)
        player.sendMessage('club/getClubInfoReply', {ok: true, roomInfo: room, clubInfo, clubs, isAdmin});
    },
    'club/leave': async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId})
        if (!club) {
            player.sendMessage('club/leaveReply', {ok: false, info: TianleErrorCode.clubNotExists});
            return
        }
        const leaveId = player.model._id;
        if (club.owner === leaveId) {
            player.sendMessage('club/leaveReply', {ok: false, info: TianleErrorCode.ownerNotLeave});
            return
        }
        const clubMemberInfo = await ClubMember.findOne({club: club._id, member: leaveId})
        if (!clubMemberInfo) {
            player.sendMessage('club/leaveReply', {ok: false, info: TianleErrorCode.notClubMember});
            return
        }
        if (clubMemberInfo.clubGold !== undefined && clubMemberInfo.clubGold < 0) {
            player.sendMessage('club/leaveReply', {ok: false, info: TianleErrorCode.dataNotAbnormal});
            return
        }
        await ClubMember.remove({member: leaveId, club: club._id})
        player.sendMessage('club/leaveReply', {ok: true, data: {}});
    },
    'club/getRequestInfo': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }
        if (!myClub) {
            player.sendMessage('club/getRequestInfoReply', {ok: false, info: TianleErrorCode.notClubAdmin});
            return
        }
        if (myClub.shortId !== message.clubShortId) {
            player.sendMessage('club/getRequestInfoReply', {ok: false, info: TianleErrorCode.noPermission});
            return
        }

        const clubRequestInfo = await ClubRequest.find({clubShortId: message.clubShortId});
        player.sendMessage('club/getRequestInfoReply', {ok: true, data: {requestList: clubRequestInfo}});
    },
    'club/dealRequest': async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId})
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        const isClubOwnerAdmin = myClub && myClub.shortId === message.clubShortId;
        const memberShip = await ClubMember.findOne({club: club._id, member: player._id}).lean()

        const isAmin = memberShip.role === 'admin'

        if (isClubOwnerAdmin || isAmin) {
            await ClubRequest.remove({
                playerId: message.requestId,
                clubShortId: message.clubShortId
            });

            if (message.refuse) {
                player.sendMessage('club/dealRequestReply', {ok: false, info: TianleErrorCode.refuseClubApply});
                return;
            }

            const clubMember = await ClubMember.findOne({
                club: myClub._id,
                member: message.requestId
            });

            if (clubMember) {
                player.sendMessage('club/dealRequestReply', {ok: false, info: TianleErrorCode.alreadyJoinClub});
                return
            }

            const nJoinedClub = await ClubMember.count({
                member: message.requestId
            })

            if (nJoinedClub >= 5) {
                player.sendMessage('club/dealRequestReply', {ok: false, info: TianleErrorCode.joinMaxClub});
                return
            }

            const clubId = myClub._id
            await ClubMember.create({
                club: clubId,
                member: message.requestId,
                clubGold: 0,
            })
            player.sendMessage('club/dealRequestReply', {ok: true, data: {}});
            return;
        }

        player.sendMessage('club/dealRequestReply', {ok: false, info: TianleErrorCode.requestError});
    },
    'club/updatePlayerInfo': async (player, message) => {
        const ownerClub = await Club.find({owner: player.model._id});
        const tempClub = [];
        if (ownerClub && ownerClub.length > 0) {
            // 存在俱乐部
            ownerClub.forEach(c => {
                tempClub.push(c.shortId);
            })
        }

        player.model.myClub = tempClub;
        player.model.joinClubShortIds = [];

        const playerShortIds = await getPlayerJoinClub(player.model._id);
        if (playerShortIds) {
            player.model.joinClubShortIds = playerShortIds;
        }

        player.sendMessage('club/updatePlayerInfoReply', {
            ok: true, data: {
                joinClubShortId: player.model.joinClubShortIds,
                myClub: player.model.myClub
            }
        });
    },
    'club/recordList': async (player, message) => {
        return getRecordListZD(player, message);
    },
    'club/recordRankList': async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId, gameType: message.gameType});
        if (!club) {
            return player.sendMessage('club/recordRankListReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        let onlyShowMySelf = true;
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (myClub || await playerIsAdmin(player.model._id, message.clubShortId)) {
            onlyShowMySelf = false;
        }

        return getRecordRankListByZD(player, message, onlyShowMySelf);
    },
    // 管理员查询发牌记录
    'club/recordRoomPlayerInfo': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }
        if (myClub && myClub.shortId === message.clubShortId) {
            const records = await GameRecord
                .find({room: message.roomId, type: message.gameType})
                .sort({time: 1})
                .lean()
                .exec()
            const roomNum = records[0] && records[0].game.roomId
            const allJuShu = records[0] && records[0].game.rule.juShu
            const playerInfos = []
            const roomInfos = {
                ju: []
            }
            records.forEach(record => {
                const playerInfo = record.record;
                const events = record.events.splice(0, 4);
                for (let i = 0; i < playerInfo.length; i++) {
                    const playerCardsInfo = events.find(x => x.index === i);
                    playerInfo[i].cards = [];
                    if (playerCardsInfo) {
                        playerInfo[i].cards = playerCardsInfo.info.cards;
                    }
                }
                // 最后一局解散，出现多余战绩bug(例如共12局出现13.14局战绩)，用规则限制个数
                if (playerInfos.length >= allJuShu) {
                    return;
                }
                roomInfos.ju.push(record.juShu);
                playerInfos.push(playerInfo);
            })
            player.sendMessage('club/recordRoomPlayerInfoReply', {ok: true, data: {playerInfos, roomInfos, roomNum}});
            return;
        }
        player.sendMessage('club/recordRoomPlayerInfoReply', {ok: false, info: TianleErrorCode.noPermission});
    },

    // 管理员清除战绩
    'club/changeClubRecordState': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }
        if (!myClub) {
            player.sendMessage('club/changeClubRecordStateReply', {ok: false, info: TianleErrorCode.noPermission});
            return;
        }
        try {
            await RoomRecord.update({room: message.room}, {
                checked: true,
            })
            player.sendMessage('club/changeClubRecordStateReply', {ok: true, data: {}});
        } catch (e) {
            logger.error(e)
        }
    },

    // 管理员战队已读
    'club/seenClubRecords': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }
        if (!myClub) {
            player.sendMessage('club/seenClubRecordsReply', {ok: false, info: TianleErrorCode.noPermission});
            return;
        }
        try {
            await RoomRecord.update({room: message.room}, {
                seen: true,
            })
            player.sendMessage('club/seenClubRecordsReply', {ok: true, data: {}});
        } catch (e) {
            logger.error(e)
        }
    },

    'club/changeState': async (player, message) => {
        const myClub = await Club.findOne({owner: player.model._id, shortId: message.clubShortId});

        if (myClub) {
            myClub.state = message.state
            await myClub.save()
            player.sendMessage('club/changeStateReply', {ok: true, data: {state: message.state}})
        } else {
            player.sendMessage('club/changeStateReply', {ok: false, info: TianleErrorCode.clubIsPause})
        }
    },
    'club/getClubMembers': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }
        if (!myClub) {
            player.sendMessage('club/getClubMembersReply', {ok: false, info: TianleErrorCode.notClubAdmin});
            return
        }
        const params = {club: myClub._id};
        if (message.playerShortId) {
            const searchInfo = await PlayerModel.findOne({shortId: message.playerShortId});
            params["member"] = searchInfo._id;
        }
        const clubExtra = await getClubExtra(myClub._id);
        const clubMembers = await ClubMember.find(params);
        const clubMembersInfo = [];
        const clubExtraData = {
            blacklist: clubExtra && clubExtra.blacklist,
            renameList: clubExtra && clubExtra.renameList,
        }
        for (const clubMember of clubMembers) {
            const memberInfo = await PlayerModel.findOne({_id: clubMember.member})
            if (memberInfo) {
                clubMembersInfo.push({
                    name: memberInfo.nickname,
                    id: memberInfo._id,
                    headImage: memberInfo.avatar,
                    diamond: memberInfo.diamond,
                    clubGold: clubMember.clubGold,
                    shortId: memberInfo.shortId,
                    isAdmin: clubMember.role === 'admin'
                })
            }
        }

        player.sendMessage('club/getClubMembersReply', {ok: true, data: {clubMembersInfo, clubExtraData}});
    },
    'club/renameClubPlayer': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (!myClub) {
            player.sendMessage('club/renameClubPlayerReply', {ok: false, info: TianleErrorCode.notClubAdmin});
            return
        }
        const clubExtra = await getClubExtra(myClub._id);
        const renameList = clubExtra.renameList;
        renameList[message.playerId] = message.rename;

        await ClubExtra.update({clubId: myClub._id}, {$set: {renameList}})
        player.sendMessage('club/renameClubPlayerReply', {ok: true, data: {}});
    },
    // 俱乐部改名
    [ClubAction.rename]: async (player, message) => {
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            player.replyFail(ClubAction.rename, TianleErrorCode.noPermission);
            return
        }
        const playerInfo = await PlayerModel.findOne({_id: player.model._id})
        // 检查房卡
        const config = await GlobalConfig.findOne({name: "renameClubDiamond"}).lean();
        const requiredDiamond = config ? Number(config.value) : 200;
        if (playerInfo.diamond < requiredDiamond) {
            return player.replyFail(TianleErrorCode.diamondInsufficient);
        }

        if (!message.newClubName || message.newClubName.length > config.club.maxNameLength) {
            return player.replyFail(TianleErrorCode.invalidName);
        }

        // 保存新名字
        const oldName = myClub.name;
        myClub.name = message.newClubName;
        await myClub.save();
        const remainDiamond = playerInfo.diamond - requiredDiamond;
        await PlayerModel.update({_id: player.model._id}, {$set: {diamond: remainDiamond}}).exec();
        player.replySuccess({diamond: remainDiamond, clubName: myClub.name});
        // 添加日志
        await logRename(myClub._id, oldName, myClub.name, playerInfo._id);
    },
    // 转移
    [ClubAction.transfer]: async (player, message) => {
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.replyFail(TianleErrorCode.noPermission);
        }
        const playerInfo = await PlayerModel.findOne({_id: player.model._id});
        // 检查房卡
        const outConfig = await GlobalConfig.findOne({name: "transferOutDiamond"}).lean();
        const outDiamond = outConfig ? Number(outConfig.value) : 500;
        if (playerInfo.diamond < outDiamond) {
            return player.replyFail(TianleErrorCode.diamondInsufficient);

        }
        // 转入的房卡
        const inConfig = await GlobalConfig.findOne({name: "transferInDiamond"}).lean();
        const inDiamond = inConfig ? Number(inConfig.value) : 500;
        // 接收人
        const transferee = await PlayerModel.findOne({shortId: message.toShortId});
        if (!transferee) {
            player.replyFail(TianleErrorCode.playerNotExists);
            return
        }
        // if (!transferee.phone || !playerInfo.phone) {
        //   player.replyFail(ClubAction.transfer, TianleErrorCode.playerNotBindPhone);
        //   return
        // }
        if (transferee.diamond < inDiamond) {
            player.replyFail(TianleErrorCode.tranferInPlayerDiamondInsufficient);
            return
        }
        if (transferee.shortId === playerInfo.shortId) {
            player.replyFail(TianleErrorCode.transferClubSamePlayer);
            return
        }
        const hasClub = await Club.findOne({owner: transferee._id});
        if (hasClub) {
            return player.replyFail(TianleErrorCode.alreadyCreateClub);
        }
        // 保存
        myClub.owner = transferee._id;
        await myClub.save();
        await PlayerModel.update({_id: player.model._id}, {$set: {gem: playerInfo.gem - outDiamond}}).exec();
        await PlayerModel.update({_id: transferee._id}, {$set: {gem: transferee.gem - inDiamond}}).exec();
        // 添加被转移人为成员
        const member = await ClubMember.findOne({member: transferee._id, club: myClub._id});
        if (!member) {
            await ClubMember.create({
                club: myClub._id,
                member: transferee._id,
                joinAt: new Date()
            })
        }

        if (member && member.role === "admin") {
            await ClubMember.update({_id: member._id}, {$set: {role: null}}).exec();
        }

        player.replySuccess({diamond: playerInfo.diamond - outDiamond});
        // 通知被转移人
        await notifyTransfer(playerInfo, transferee, myClub.name, myClub.shortId);
        // 添加日志
        await logTransfer(myClub._id, playerInfo._id, transferee._id);
    },
    'club/operateBlackList': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (!myClub) {
            player.sendMessage('club/operateBlackListReply', {ok: false, info: TianleErrorCode.notClubAdmin});
            return
        }
        if (myClub.owner === message.playerId) {
            player.sendMessage('club/operateBlackListReply', {ok: false, info: TianleErrorCode.notOperateClubCreator});
            return
        }
        const clubExtra = await getClubExtra(myClub._id);
        let blacklist = clubExtra.blacklist;
        if (message.operate === 'add') {
            blacklist.push(message.playerId);
        } else {
            blacklist = blacklist.filter(x => x !== message.playerId);
        }
        clubExtra.blacklist = blacklist;
        await clubExtra.save();
        player.sendMessage('club/operateBlackListReply', {ok: true, data: {}});
    },
    'club/removePlayer': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        let roleType = myClub ? 1 : -1;
        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);
        if (!myClub && isAdmin) {
            roleType = 2;
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (!myClub) {
            return player.sendMessage('club/removePlayerReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        if (myClub.owner === message.playerId) {
            return player.sendMessage('club/removePlayerReply', {
                ok: false,
                info: TianleErrorCode.notOperateClubCreator
            });
        }

        // 做管理员的校验
        if (roleType === 2) {
            const memberShip = await ClubMember.findOne({club: myClub._id, member: message.playerId}).lean()

            if (memberShip.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (message.playerId === player._id) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        await ClubMember.remove({member: message.playerId, club: myClub._id})
        player.sendMessage('club/removePlayerReply', {ok: true, data: {}});
    },

    // 设置默认规则
    'club/setDefaultRule': async (player, message) => {
        if (!message.gameType) {
            player.sendMessage('club/setDefaultRuleReply', {ok: false, info: '错误的请求'})
            return
        }
        let myClub = await Club.findOne({owner: player.model._id});
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (myClub) {
            myClub.defaultRule = message.rule
            await myClub.save()
            player.sendMessage('club/setDefaultRuleReply', {ok: true})
        } else {
            player.sendMessage('club/setDefaultRuleReply', {ok: false, info: '错误的请求'})
        }
    },
    'club/setDefaultGoldRule': async (player, message) => {
        if (!message.gameType) {
            player.sendMessage('club/setDefaultGoldRuleReply', {ok: false, info: '错误的请求'})
            return
        }
        let myClub = await Club.findOne({owner: player.model._id});
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (myClub) {
            myClub.defaultGoldRule = message.rule
            await myClub.save()
            player.sendMessage('club/setDefaultGoldRuleReply', {ok: true})
        } else {
            player.sendMessage('club/setDefaultGoldRuleReply', {ok: false, info: '错误的请求'})
        }
    },
    'club/setLockRule': async (player, message) => {
        if (!message.gameType) {
            player.sendMessage('club/setLockRuleReply', {ok: false, info: '错误的请求'})
            return
        }
        let myClub = await Club.findOne({owner: player.model._id});
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (myClub) {
            myClub.lockedRule = message.lockedRule
            await myClub.save()
            player.sendMessage('club/setLockRuleReply', {ok: true})
        } else {
            player.sendMessage('club/setLockRuleReply', {ok: false, info: '错误的请求'})
        }
    },
    'club/promoteAdmin': async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.sendMessage('club/promoteAdminReply', {ok: false, info: TianleErrorCode.noPermission});
        }
        if (myClub.owner === player._id) {
            return player.sendMessage('club/promoteAdminReply', {
                ok: false,
                info: TianleErrorCode.notOperateClubCreator
            });
        }

        const member = await PlayerModel.findOne({shortId: message.playerShortId});
        const memberShip = await ClubMember.findOne({club: myClub._id, member: member._id});

        if (!memberShip) {
            return player.sendMessage('club/promoteAdminReply', {ok: false, info: TianleErrorCode.notClubMember})
        }

        memberShip.role = message.role === "add" ? 'admin' : null;
        await memberShip.save();
        return player.sendMessage('club/promoteAdminReply', {ok: true, data: {}})
    },
    'club/createNewClub': async (player, message) => {
        const ownerClub = await Club.findOne({owner: player.model._id});
        if (ownerClub) {
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.alreadyCreateClub});
            return;
        }

        const joinedClub = await ClubMember.count({member: player.model._id});
        if (joinedClub >= 5) {
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.joinMaxClub});
            return;
        }

        if (!message.clubName) {
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.invalidName});
            return;
        }

        const playerInfo = await PlayerModel.findOne({_id: player.model._id});
        player.model.diamond = playerInfo.diamond;

        const config = await GlobalConfig.findOne({name: "applyClubDiamond"}).lean();
        const applyDiamond = config ? Number(config.value) : 100;
        if (player.model.diamond < applyDiamond) {
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.diamondInsufficient})
            return
        }
        // if (!player.model.phone) {
        //   player.sendMessage('club/createNewClubReply', { ok: false, info: '请在大厅内先完成手机绑定，然后再创建战队' })
        //   return
        // }

        if (await Club.findOne({name: message.clubName})) {
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.clubNameIsRepeat})
            return
        }
        const clubGlobal = await Club.findOne().sort({shortId: -1}).limit(1);
        let clubShortId = !clubGlobal ? 100001 : clubGlobal.shortId + 1;

        try {
            const club = new Club({
                owner: player.model._id,
                shortId: clubShortId,
                name: message.clubName
            })
            await club.save()
            await ClubMember.create({
                club: club._id, member: player.model._id,
                joinAt: new Date()
            })

            const result = await service.playerService.logAndConsumeDiamond(player.model._id,
                ConsumeLogType.createNewClub, applyDiamond, '创建新战队扣除钻石');

            if (!result.isOk) {
                return player.sendMessage('club/createNewClubReply', {ok: true, info: TianleErrorCode.systemError})
            }

            player.model = result.model;
            await player.updateResource2Client();

            player.sendMessage('club/createNewClubReply', {
                ok: true,
                data: {shortId: clubShortId, clubName: message.clubName}
            });
        } catch (e) {
            console.error(e);
            player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.createClubError})
            return

        }
    },

    [ClubAction.editRule]: async (player, message) => {
        const result = await ClubRuleModel.findById(message.ruleId);
        if (!result) {
            player.replyFail(ClubAction.editRule, '没有此规则');
            return;
        }
        const isOk = await hasRulePermission(result.clubId, player.model._id);
        if (!isOk) {
            player.replyFail(ClubAction.editRule, '没有权限');
            return;
        }
        const rule = message.rule;
        // 人数不可更改
        rule.playerCount = result.playerCount;
        delete rule.ruleId;
        result.rule = rule;
        await result.save();
        player.replySuccess(ClubAction.editRule);
    },
    [ClubAction.addRule]: async (player, message) => {
        const clubShortId = message.clubShortId;
        const gameType = message.gameType;
        // 公共房还是金币房
        const ruleType = message.ruleType;
        const rule = message.rule;
        const playerCount = rule.playerCount;
        const club = await Club.findOne({gameType, shortId: clubShortId});
        if (!club) {
            player.replyFail(ClubAction.addRule, '俱乐部不存在');
            return;
        }
        const isOk = await hasRulePermission(club._id, player.model._id);
        if (!isOk) {
            player.replyFail(ClubAction.addRule, '没有权限');
            return;
        }
        // 根据玩家数查找规则
        const find = await ClubRuleModel.findOne({clubId: club._id, gameType, ruleType, playerCount});
        if (find) {
            // 当前玩家人数的规则已经有了
            player.replyFail(ClubAction.addRule, '当前规则已存在');
            return;
        }
        const {model} = await createClubRule(club._id, gameType, playerCount, ruleType, rule);
        // @ts-ignore
        player.replySuccess(ClubAction.addRule, {...model.rule, ruleId: model._id.toString()})
    },
    [ClubAction.deleteRule]: async (player, message) => {
        const result = await ClubRuleModel.findById(message.ruleId);
        if (!result) {
            player.replyFail(ClubAction.deleteRule, '没有此规则');
            return;
        }
        const isOk = await hasRulePermission(result.clubId, player.model._id);
        if (!isOk) {
            player.replyFail(ClubAction.deleteRule, '没有权限');
            return;
        }
        await result.remove();
        player.replySuccess(ClubAction.deleteRule);
    },
}

// 邮件通知战队转移
async function notifyTransfer(oldOwner, newOwner, clubName, clubId) {
    const mail = new MailModel({
        to: newOwner._id,
        type: MailType.MESSAGE,
        title: '战队转移通知',
        content: `${oldOwner.name}(${oldOwner.shortId})将战队${clubName}(${clubId})转移给您`,
        state: MailState.UNREAD,
        createAt: new Date(),
        gift: {gem: 0, ruby: 0, gold: 0}
    })
    await mail.save();
}

/**
 * 获取 club 规则
 * @param club club model
 */
async function getClubRule(club) {
    const publicRule = [];
    const goldRule = [];

    const result = await ClubRuleModel.find({clubId: club._id});
    if (result.length > 0) {
        for (const r of result) {
            if (r.ruleType === RuleType.public) {
                publicRule.push({...r.rule, ruleId: r._id.toString()});
            } else if (r.ruleType === RuleType.gold) {
                goldRule.push({...r.rule, ruleId: r._id.toString()});
            }
        }
        return {publicRule, goldRule};
    }

    return {publicRule: [], goldRule: []};
}

async function isClubOwner(clubShortId, gameType, playerId) {
    // 检查是否创建者
    const myClub = await Club.findOne({
        shortId: clubShortId,
        gameType,
    });
    if (!myClub) {
        // 俱乐部不存在
        return false;
    }
    return myClub.owner === playerId;
}

// 是否有权限更改规则
async function hasRulePermission(clubId, playerId) {
    // 检查是否创建者、管理员
    const myClub = await Club.findById(clubId);
    if (!myClub) {
        // 俱乐部不存在
        return false;
    }
    if (myClub.owner === playerId) {
        // 创建者
        return true;
    }
    const member = await ClubMember.findOne({club: clubId, member: playerId});
    // 是成员且为管理员
    return member && member.role === 'admin';
}

// 炸弹榜
async function getRecordRankListByZD(player, message: any, onlyShowMySelf) {
    const club = await Club.findOne({shortId: message.clubShortId});
    if (club) {
        const clubExtra = await getClubExtra(club._id);
        const renameList = clubExtra.renameList;
        const players = await PlayerModel.find({_id: {$in: Object.keys(renameList)}});
        // 通过 shortId 查找备注名
        const nameMap = {};
        for (const p of players) {
            if (renameList[p._id]) {
                nameMap[p.shortId] = renameList[p._id];
            }
        }

        // 取3天的记录
        const minDate = new Date();
        minDate.setHours(0);
        minDate.setMinutes(0);
        minDate.setSeconds(0);
        minDate.setMilliseconds(0);
        minDate.setDate(minDate.getDate() - 3);

        const params = {
            club: club._id, scores: {$ne: []},
            players: {$ne: []}, createAt: {$gt: minDate}
        }
        if (message.gameType) {
            params["category"] = message.gameType;
        }

        const records = await RoomRecord
            .find(params)
            .sort({createAt: -1})
            .lean()
            .exec()
        // 局数字典
        const juShuDict = {
            4: '4',
            6: '6',
            8: '8',
            12: '12',
            18: '18',
            24: '24',
        }
        const initJuValue = () => {
            const dict = {};
            for (const value of Object.values(juShuDict)) {
                dict[value] = 0;
            }
            return dict;
        }
        const rankData = [];
        const totalStatistic = {};
        let currentDate = new Date(Date.now());
        let detailData = [];
        const clubMembers = await ClubMember.find({club: club._id})
            .populate('member').lean();
        for (const clubMember of clubMembers) {
            if (clubMember.member) {
                detailData = [];
                for (let i = 0; i < 4; i++) {
                    currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * i);
                    detailData.push({
                        time: currentDate.toLocaleDateString(),
                        // 大赢家次数
                        bigWinnerCount: 0,
                        bigWinnerRoomIds: [],
                        roomJuCount: 0,
                        juData: {
                            club: {
                                gold: initJuValue(),
                                normal: initJuValue(),
                            },
                            person: {
                                gold: initJuValue(),
                                normal: initJuValue(),
                            }
                        },
                        scoreData: {
                            club: {
                                gold: 0,
                                normal: 0
                            },
                            person: {
                                gold: 0,
                                normal: 0
                            }
                        }
                    })
                }
                const pData = {
                    shortId: clubMember.member.shortId,
                    avatar: clubMember.member.avatar,
                    name: clubMember.member.nickname + (nameMap[clubMember.member.shortId] ?
                        `(${nameMap[clubMember.member.shortId]})` : ''),
                    commentName: nameMap[clubMember.member.shortId] || '',
                    score: clubMember.member.score || 0,
                    detailData,
                }
                if (onlyShowMySelf) {
                    if (clubMember.member.shortId === player.model.shortId) {
                        rankData.push(pData);
                    }
                } else {
                    rankData.push(pData);
                }
            }
        }
        records.forEach(r => {
            const juShu = r.rule.juShu;
            const isPerson = r.rule.clubPersonalRoom;
            const isGoldRoom = r.rule.useClubGold;
            const roomTime = new Date(r.createAt).toLocaleDateString();
            if (!totalStatistic[roomTime]) {
                totalStatistic[roomTime] = {
                    juShu: initJuValue(),
                    // 开房次数
                    createTimes: 0,
                    // 房卡消费
                    gemCount: 0,
                    // 局内解散数
                    dissolveRoom: 0,
                };
            }
            // 开房次数
            totalStatistic[roomTime].createTimes++;
            // 房卡消费
            if (r.gemCount) {
                for (const k of Object.keys(r.gemCount)) {
                    totalStatistic[roomTime].gemCount += r.gemCount[k];
                }
            }
            // 统计每局
            if (juShuDict[juShu]) {
                totalStatistic[roomTime]['juShu'][juShuDict[juShu]]++;
            }
            if (r.juIndex && r.juIndex === 1) {
                // 一局内解散
                totalStatistic[roomTime].dissolveRoom++;
            }
            const juAdd = function (x, ju = "ju4") {
                if (isPerson) {
                    if (isGoldRoom) {
                        x.juData.person.gold[ju] += 1;
                    } else {
                        x.juData.person.normal[ju] += 1;
                    }
                } else {
                    x.roomJuCount += 1;
                    if (isGoldRoom) {
                        x.juData.club.gold[ju] += 1;
                    } else {
                        x.juData.club.normal[ju] += 1;
                    }
                }
            }
            const scoreAdd = function (x, score) {
                if (isPerson) {
                    if (isGoldRoom) {
                        x.scoreData.person.gold += score;
                    } else {
                        x.scoreData.person.normal += score;
                    }
                } else {
                    if (isGoldRoom) {
                        x.scoreData.club.gold += score;
                    } else {
                        x.scoreData.club.normal += score;
                    }
                }
            }
            r.scores.forEach(d => {
                // score 不为空
                if (!d || onlyShowMySelf && d.shortId !== player.model.shortId) {
                    return
                }
                let tempIndex = rankData.findIndex(x => x.shortId === d.shortId);
                detailData = [];
                for (let i = 0; i < 4; i++) {
                    currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * i);
                    detailData.push({
                        time: currentDate.toLocaleDateString(),
                        bigWinnerCount: 0,
                        bigWinnerRoomIds: [],
                        juData: {
                            club: {
                                gold: initJuValue(),
                                normal: initJuValue(),
                            },
                            person: {
                                gold: initJuValue(),
                                normal: initJuValue(),
                            }
                        },
                        scoreData: {
                            club: {
                                gold: 0,
                                normal: 0
                            },
                            person: {
                                gold: 0,
                                normal: 0
                            }
                        }
                    })
                }
                let pData = {
                    shortId: d.shortId,
                    avatar: d.avatar,
                    nickname: d.nickname,
                    score: d.score,
                    detailData,
                }
                if (tempIndex === -1) {
                    rankData.push(pData);
                    tempIndex = rankData.length - 1;
                    pData = rankData[tempIndex];
                } else {
                    pData = rankData[tempIndex];
                    pData.score += d.score;
                }

                pData.detailData.forEach(x => {
                    if (roomTime === x.time) {
                        scoreAdd(x, d.score);
                        // 大赢家次数
                        if (r.bigWinner) {
                            for (const shortId of r.bigWinner) {
                                if (pData.shortId === shortId) {
                                    x.bigWinnerCount++;
                                    x.bigWinnerRoomIds.push(r.roomNum);
                                }
                            }
                        }
                    }
                })
                if (juShuDict[juShu]) {
                    // 有局数
                    pData.detailData.forEach(x => {
                        if (roomTime === x.time) {
                            juAdd(x, juShuDict[juShu]);
                        }
                    })
                }
            })
        })

        return player.sendMessage('club/recordRankListReply', {ok: true, rankData, summary: totalStatistic});
    }
    player.sendMessage('club/recordRankListReply', {ok: false, info: '无法查看！'});
}

// 炸弹榜详情
async function getRecordListZD(player, message: any) {
    const club = await Club.findOne({shortId: message.clubShortId});
    const clubExtra = await getClubExtra(club._id);
    const renameList = clubExtra.renameList;
    const players = await PlayerModel.find({_id: {$in: Object.keys(renameList)}});
    // 通过 shortId 查找备注名
    const nameMap = {};
    for (const p of players) {
        if (renameList[p._id]) {
            nameMap[p.shortId] = renameList[p._id];
        }
    }
    // 查找未删除的记录
    const params = {club: club._id, scores: {$ne: []}};
    if (message.gameType) {
        params["category"] = message.gameType;
    }
    const records = await RoomRecord
        .find(params)
        .sort({createAt: -1})
        .limit(1000)
        .lean()
        .exec()
    const isClubOwnerOAdmin = await hasRulePermission(club._id, player.model._id);
    const formatted = [];
    for (const record of records) {
        let isMyRecord = false;
        let maxScore = 0;
        let winnerIndex = 0;
        for (let i = 0; i < record.scores.length; i++) {
            const scoreInfo = record.scores[i];
            if (scoreInfo && scoreInfo.score > maxScore) {
                maxScore = record.scores[i].score;
                winnerIndex = i;
            }
        }
        const scores = record.scores.map(s => {
            if (s.shortId === player.model.shortId) {
                isMyRecord = true;
            }
            return {
                ...s,
                // 备注名
                commentName: s && nameMap[s.shortId] || '',
            }
        });
        if (isMyRecord || isClubOwnerOAdmin) {
            formatted.push({
                _id: record.room,
                roomId: record.roomNum,
                time: record.createAt.getTime(),
                creatorId: record.creatorId || 233,
                players: scores,
                winner: winnerIndex,
                rule: record.rule,
                roomState: record.roomState,
                checked: record.checked,
                seen: record.seen,
            })
        }
    }
    return player.sendMessage('club/recordListReply', {ok: true, records: formatted});
}