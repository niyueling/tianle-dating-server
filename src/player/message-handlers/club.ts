import {ConsumeLogType, GameType, TianleErrorCode} from "@fm/common/constants";
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
import Player from '../../database/models/player'
import RoomRecord from '../../database/models/roomRecord'
import {service} from "../../service/importService";
import GlobalConfig from "../../database/models/globalConfig";
import {createClient} from "../../utils/redis";
import * as config from '../../config'
import ClubMerge from "../../database/models/clubMerge";
import ClubMessage from "../../database/models/clubMessage";
import clubMessage from "../../database/models/clubMessage";

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
    // 规则列表
    ruleList = 'club/ruleList',
    // 删除规则
    deleteRule = 'club/deleteRule',
    // 申请战队
    request = "club/request",
    // 获取俱乐部基本信息
    getInfo = 'club/getClubInfo',
    // 离开战队
    leave = 'club/leave',
    // 获取申请列表
    getRequestInfo = 'club/getRequestInfo',
    // 成员审核
    dealRequest = 'club/dealRequest',
    // 检测是否加入俱乐部
    updatePlayerInfo = 'club/updatePlayerInfo',
    // 战绩/排行明细(适配合伙人权限)
    recordList = 'club/recordList',
    // 排行汇总(适配合伙人权限)
    recordRankList = 'club/recordRankList',
    // 发牌记录(适配合伙人权限)
    recordRoomPlayerInfo = 'club/recordRoomPlayerInfo',
    // 清除战绩(适配合伙人权限)
    changeClubRecordState = 'club/changeClubRecordState',
    // 战绩已读(适配合伙人权限)
    seenClubRecords = 'club/seenClubRecords',
    // 战队开启/暂停
    changeState = 'club/changeState',
    // 成员列表(适配合伙人权限)
    getClubMembers = 'club/getClubMembers',
    // 设置备注(适配合伙人权限)
    renameClubPlayer = 'club/renameClubPlayer',
    // 设置黑名单(适配合伙人权限)
    operateBlackList = 'club/operateBlackList',
    // 踢出用户(适配合伙人权限)
    removePlayer = 'club/removePlayer',
    // 设置管理员
    promoteAdmin = 'club/promoteAdmin',
    // 创建俱乐部
    createNewClub = 'club/createNewClub',
    // 俱乐部配置表
    clubConfig = 'club/getClubConfig',
    // 设置/取消合伙人
    promotePartner = 'club/promotePartner',
    // 合并战队
    mergeClub = 'club/mergeClub',
    // 同意/拒绝合并战队申请
    dealClubRequest = 'club/dealClubRequest',
    // 合伙人邀请普通用户加入战队
    inviteNormalPlayer = 'club/inviteNormalPlayer',
    // 用户同意合伙人战队邀请
    dealClubInviteRequest = 'club/dealClubInviteRequest',
    // 合伙人列表
    getClubPartner = 'club/getClubPartner',
    // 判断用户是否在黑名单
    checkPlayerIsBlack = 'club/checkPlayerIsBlack',
    // 删除消息
    deleteMessage = 'club/deleteMessage',
    // 已读消息
    readMessage = 'club/readMessage',
    // 解散战队
    disband = 'club/disband',
}

export async function getClubInfo(clubId, player?) {
    const playerClub = await getPlayerClub(player._id, clubId);
    if (!playerClub) {
        player.replyFail(ClubAction.getInfo, TianleErrorCode.notClubPlayer);
        return;
    }

    const allClubMemberShips = await ClubMember.find({member: player._id}).populate('club').lean();
    const clubs = allClubMemberShips.map(cm => cm.club);
    const room = await getClubRooms(playerClub._id);
    const currentClubMemberShip = allClubMemberShips.find(x => x.club._id.toString() === clubId.toString());
    const isAdmin = (currentClubMemberShip && currentClubMemberShip.role === 'admin');
    const isClubOwner = playerClub.owner === player._id.toString();
    const isPartner = currentClubMemberShip && currentClubMemberShip.partner;
    const clubOwnerId = playerClub.owner;
    const clubOwner = await PlayerModel.findOne({_id: clubOwnerId}).sort({nickname: 1});
    const clubRule = await getClubRule(playerClub);
    const currentClubPlayerGold = currentClubMemberShip && currentClubMemberShip.clubGold || 0;
    const clubInfo = {
        diamond: clubOwner.diamond,
        name: clubOwner.nickname,
        clubGold: currentClubPlayerGold,
        clubName: playerClub.name,
        clubShortId: playerClub.shortId,
        publicRule: clubRule.publicRule
    }

    return {ok: true, data: {roomInfo: room, clubInfo, clubs, isAdmin: !!isAdmin, isPartner: !!isPartner, isClubOwner}};
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

export async function getClubExtra(clubId) {
    let clubExtra = await ClubExtra.findOne({clubId});
    if (!clubExtra) {
        clubExtra = await ClubExtra.create({
            clubId
        });
    }
    return clubExtra;
}

async function getClubRooms(clubId, gameType = null) {
    console.warn("clubId-%s, gameType-%s", clubId, gameType);
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
            const playerAvatars = [];

            for (let i = 0; i < roomInfo.players.length; i++) {
                const p = roomInfo.players[i];

                if (p) {
                    const pModel = await service.playerService.getPlayerModel(p);
                    playerAvatars.push(pModel.avatar);
                }
            }

            if (gameType && rule.gameType !== gameType) {
                continue;
            }

            clubRooms.push({
                roomNum,
                roomCreator,
                rule,
                playerOnline,
                juIndex,
                gameType: rule.gameType,
                playerCount: rule.playerCount,
                playerAvatars: playerAvatars
            });
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

export async function requestToUserCenter(channel, name, playerId, info) {

    const player = await Player.findOne({_id: playerId});

    if (!player) {
        return
    }

    channel.publish(
        `userCenter`,
        `user.${playerId}`,
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
        return clubMemberInfo.role === 'admin' || playerId.toString() === club.owner;
    }
    return false
}

export async function playerIsPartner(playerId, clubShortId) {
    const club = await Club.findOne({shortId: clubShortId});
    if (!club) {
        return false;
    }
    const clubMemberInfo = await ClubMember.findOne({member: playerId, club: club._id});

    if (clubMemberInfo) {
        return clubMemberInfo.partner;
    }
    return false
}

export async function createNewClub(playerInfo, leavePlayers) {
    const ownerClub = await Club.findOne({owner: playerInfo._id});
    if (ownerClub) {
        return false;
    }

    const joinedClub = await ClubMember.count({member: playerInfo._id});
    if (joinedClub >= 5) {
        return false;
    }

    const clubGlobal = await Club.findOne().sort({shortId: -1}).limit(1);
    let clubShortId = !clubGlobal ? 100001 : clubGlobal.shortId + 1;

    const club = new Club({
        owner: playerInfo._id,
        shortId: clubShortId,
        name: `${playerInfo.nickname}的战队`,
        freeRenameCount: 1
    })
    await club.save();

    for (let i = 0; i < leavePlayers.length; i++) {
        await ClubMember.create({
            club: club._id, member: leavePlayers[i].member,
            joinAt: new Date()
        })
    }

    return true;
}

export default {
    [ClubAction.request]: async (player, message) => {
        const alreadyJoinedClubs = await ClubMember.count({member: player.model._id}).lean()

        if (alreadyJoinedClubs >= 5) {
            return player.replyFail(ClubAction.request, TianleErrorCode.joinMaxClub);
        }

        const clubRequest = await ClubRequest.findOne({
            playerId: player.model._id,
            clubShortId: message.clubShortId,
            status: 0
        });
        if (clubRequest) {
            return player.replyFail(ClubAction.request, TianleErrorCode.alreadyApplyClub);
        }

        const haveThisClub = await Club.findOne({shortId: message.clubShortId})
        if (!haveThisClub) {
            return player.replyFail(ClubAction.request, TianleErrorCode.clubNotExists);
        }

        const clubMember = await ClubMember.findOne({
            club: haveThisClub._id,
            member: player.model._id
        });

        if (clubMember) {
            return player.replyFail(ClubAction.request, TianleErrorCode.alreadyJoinClub);
        }

        await requestToAllClubMember(player.channel, 'clubRequest', haveThisClub._id, {})

        await ClubRequest.create({
            playerId: player.model._id,
            clubShortId: message.clubShortId,
            avatar: player.model.avatar,
            playerShortId: player.model.shortId,
            playerName: player.model.nickname,
            type: 1
        });

        return player.replySuccess(ClubAction.request, {shortId: message.clubShortId, clubName: haveThisClub.name});
    },
    [ClubAction.getInfo]: async (player, message) => {
        const tempClub = await Club.findOne({shortId: message.clubShortId});
        const clubId = tempClub ? tempClub._id.toString() : '';

        const playerClub = await getPlayerClub(player.model._id, clubId);
        if (!playerClub) {
            return player.replyFail(ClubAction.getInfo, TianleErrorCode.notClubPlayer);
        }

        const allClubMemberShips = await ClubMember.find({member: player.model._id}).populate('club').lean();
        const clubs = allClubMemberShips.map(cm => cm.club);
        const room = await getClubRooms(playerClub._id, message.gameType);
        const currentClubMemberShip = allClubMemberShips.find(x => x.club._id.toString() === clubId);
        const isAdmin = (currentClubMemberShip && currentClubMemberShip.role === 'admin');
        const isClubOwner = playerClub.owner === player._id.toString();
        const isPartner = (currentClubMemberShip && currentClubMemberShip.partner);
        const clubOwnerId = playerClub.owner;
        const clubOwner = await PlayerModel.findOne({_id: clubOwnerId}).sort({nickname: 1});
        const clubRule = await getClubRule(playerClub, message.gameType);
        const currentClubPlayerGold = currentClubMemberShip && currentClubMemberShip.clubGold || 0;
        const clubInfo = {
            diamond: clubOwner.diamond,
            name: clubOwner.nickname,
            clubGold: currentClubPlayerGold,
            clubName: playerClub.name,
            clubShortId: playerClub.shortId,
            publicRule: clubRule.publicRule
        }

        await player.listenClub(playerClub._id);

        return player.replySuccess(ClubAction.getInfo, {roomInfo: room, clubInfo, clubs, isAdmin: !!isAdmin, isPartner: !!isPartner, isClubOwner});
    },
    [ClubAction.leave]: async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId})
        if (!club) {
            return player.replyFail(ClubAction.leave, TianleErrorCode.clubNotExists);
        }
        const leaveId = player.model._id;
        if (club.owner.toString() === leaveId.toString()) {
            return player.replyFail(ClubAction.leave, TianleErrorCode.ownerNotLeave);
        }
        const clubMemberInfo = await ClubMember.findOne({club: club._id, member: leaveId})
        if (!clubMemberInfo) {
            return player.replyFail(ClubAction.leave, TianleErrorCode.notClubMember);
        }
        if (clubMemberInfo.clubGold !== undefined && clubMemberInfo.clubGold < 0) {
            return player.replyFail(ClubAction.leave, TianleErrorCode.dataNotAbnormal);
        }

        if (clubMemberInfo.partner) {
            // 记录被踢出的用户列表
            const leavePlayers = [{member: leaveId, roleType: 1}];
            const playerInfo = await service.playerService.getPlayerModel(leaveId);

            // 获取合伙人
            const clubTeamList = await ClubMember.find({club: club._id, leader: playerInfo.shortId});
            for (let i = 0; i < clubTeamList.length; i++) {
                leavePlayers.push({member: clubTeamList[i].member, roleType: 2});
                await ClubMember.remove({member: clubTeamList[i].member, club: club._id});
            }

            // 给合伙人和用户创建新的战队
            if (leavePlayers.length > 1) {
                await createNewClub(playerInfo, leavePlayers);
            }
        }

        await ClubMember.remove({member: leaveId, club: club._id});
        await player.cancelListenClub(club.clubId);
        return player.replySuccess(ClubAction.leave, {});
    },
    [ClubAction.getRequestInfo]: async (player, message) => {
        let myClub = await Club.findOne({shortId: message.clubShortId});

        if (!myClub) {
            return player.replyFail(ClubAction.getRequestInfo, TianleErrorCode.clubNotExists);
        }

        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);

        let messageLists = [];
        const clubMessageInfo = await ClubMessage.find({clubShortId: message.clubShortId, playerId: player.model._id});
        messageLists = [...messageLists, ...clubMessageInfo];

        if (isAdmin) {
            const clubRequestInfo = await ClubRequest.find({clubShortId: message.clubShortId, type: 1});
            const clubMergeInfo = await ClubMerge.find({fromClubId: message.clubShortId});
            messageLists = [...messageLists, ...clubRequestInfo, ...clubMergeInfo];
        }

        return player.replySuccess(ClubAction.getRequestInfo, {requestList: messageLists});
    },
    [ClubAction.dealRequest]: async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId})
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && await playerIsAdmin(player.model._id, message.clubShortId)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        const isClubOwnerAdmin = myClub && myClub.shortId === message.clubShortId;
        const memberShip = await ClubMember.findOne({club: club._id, member: player._id}).lean()

        const isAmin = memberShip.role === 'admin'

        if (isClubOwnerAdmin || isAmin) {
            const requestInfo = await ClubRequest.findOne({
                playerId: message.requestId,
                clubShortId: message.clubShortId,
                status: 0
            });
            requestInfo.status = (message.refuse ? 2 : 1);
            await requestInfo.save();

            if (message.refuse) {
                const playerInfo = await service.playerService.getPlayerModel(message.requestId);
                await refuseNewPlayerJoin(myClub.name, myClub.shortId, playerInfo);
                return player.replyFail(ClubAction.dealRequest, TianleErrorCode.refuseClubApply);
            }

            const clubMember = await ClubMember.findOne({
                club: myClub._id,
                member: message.requestId
            });

            if (clubMember) {
                return player.replyFail(ClubAction.dealRequest, TianleErrorCode.alreadyJoinClub);
            }

            const nJoinedClub = await ClubMember.count({
                member: message.requestId
            })

            if (nJoinedClub >= 5) {
                return player.replyFail(ClubAction.dealRequest, TianleErrorCode.joinMaxClub);
            }

            const clubId = myClub._id
            await ClubMember.create({
                club: clubId,
                member: message.requestId,
                clubGold: 0,
            })

            return player.replySuccess(ClubAction.dealRequest, {});
        }

        return player.replyFail(ClubAction.dealRequest, TianleErrorCode.requestError);
    },
    [ClubAction.dealClubRequest]: async (player, message) => {
        const club = await Club.findOne({shortId: message.fromClubId});
        let fromClub = await getOwnerClub(player.model._id, message.fromClubId);
        if (!fromClub && await playerIsAdmin(player.model._id, message.fromClubId)) {
            fromClub = await Club.findOne({shortId: message.fromClubId});
        }

        const ownerInfo = await Player.findOne({_id: fromClub.owner});
        const isClubOwnerAdmin = fromClub && fromClub.shortId === message.fromClubId;
        const memberShip = await ClubMember.findOne({club: club._id, member: player._id}).lean();

        const isAmin = memberShip.role === 'admin';

        if (isClubOwnerAdmin || isAmin) {
            const toClub = await Club.findOne({shortId: message.toClubId});

            // 删除申请记录
            const mergeInfo = await ClubMerge.findOne({
                fromClubId: message.fromClubId,
                toClubId: message.toClubId,
                status: 0
            });
            mergeInfo.status = (message.refuse ? 2 : 1);
            await mergeInfo.save();

            if (message.refuse) {
                return player.replyFail(ClubAction.dealClubRequest, TianleErrorCode.refuseClubApply);
            }

            // 获取小战队成员列表
            const fromClubMembers = await ClubMember.find({club: fromClub._id});

            // 删除小战队成员
            await ClubMember.remove({club: fromClub._id});

            // 删除小战队战队信息
            await Club.remove({_id: fromClub._id});

            const alreadyJoinClubs = [];

            // 将小战队的成员并入大战队
            for (let i = 0; i < fromClubMembers.length; i++) {
                const member = fromClubMembers[i];
                const clubMember = await ClubMember.findOne({
                    club: toClub._id,
                    member: member.member
                });

                if (clubMember) {
                    // 小战队主并且不是合伙人，设置合伙人身份
                    if (clubMember.member === fromClub.owner && !clubMember.partner) {
                        clubMember.partner = true;
                        await clubMember.save();
                    }

                    // 如果小战队成员已经加入战队
                    if (clubMember.member !== fromClub.owner) {
                        alreadyJoinClubs.push(clubMember.member);
                    }

                    continue;
                }

                const nJoinedClub = await ClubMember.count({
                    member: member.member
                })

                if (nJoinedClub >= 5) {
                    continue
                }

                const params = {
                    club: toClub._id,
                    member: member.member,
                    clubGold: 0,
                    partner: member.member === fromClub.owner
                };

                if (member.member !== fromClub.owner) {
                    params["leader"] = ownerInfo.shortId;
                }

                await ClubMember.create(params);

                const memberInfo = await service.playerService.getPlayerModel(member.member);

                // 给用户生成战队消息通知加入战队
                await clubMessage.create({
                    playerId: member.member,
                    clubShortId: toClub.shortId,
                    playerName: memberInfo.nickname,
                    avatar: memberInfo.avatar,
                    playerShortId: memberInfo.shortId,
                    message: `成功加入战队${toClub.name}(${toClub.shortId})`
                });
            }

            await mergeFailClubMessage(toClub.name, toClub.shortId, fromClub.owner, alreadyJoinClubs);

            await requestToAllClubMember(player.channel, 'club/updateClubRoom', toClub._id.toString(), {});

            if (alreadyJoinClubs.length > 0) {
                await requestToUserCenter(player.channel, 'club/sendMergeResult', fromClub.owner, {alreadyJoinClubs, clubInfo: toClub})
            }

            // 给大战队主生成战队消息
            const toClubOwnerInfo = await Player.findOne({_id: toClub.owner});
            await clubMessage.create({
                playerId: toClub.owner,
                clubShortId: toClub.shortId,
                playerName: toClubOwnerInfo.nickname,
                avatar: toClubOwnerInfo.avatar,
                playerShortId: toClubOwnerInfo.shortId,
                message: `战队${fromClub.name}(${fromClub.shortId})合并成功`
            });

            return player.replySuccess(ClubAction.dealClubRequest, {});
        }

        return player.replyFail(ClubAction.dealClubRequest, TianleErrorCode.requestError);
    },
    [ClubAction.disband]: async (player, message) => {
        const club = await getOwnerClub(player.model._id, message.clubShortId);
        if (!club) {
            return player.replyFail(ClubAction.disband, TianleErrorCode.noPermission);
        }

        await ClubMember.remove({club: club._id});
        await Club.remove({_id: club._id});
        await clubDisbandMessage(club.name, club.shortId, club.owner);

        return player.replySuccess(ClubAction.disband, {});
    },
    [ClubAction.dealClubInviteRequest]: async (player, message) => {
        const clubInfo = await Club.findOne({shortId: message.clubShortId});
        const clubRequest = await ClubRequest.findOne({
            clubShortId: clubInfo.shortId,
            playerId: player._id,
            status: 0
        });
        if (!clubRequest) {
            return player.replyFail(ClubAction.dealClubInviteRequest, TianleErrorCode.requestError);
        }

        const partnerInfo = await Player.findOne({shortId: clubRequest.partner});

        clubRequest.status = (message.refuse ? 2 : 1);
        await clubRequest.save();

        if (message.refuse) {
            return player.replyFail(ClubAction.dealClubInviteRequest, TianleErrorCode.refuseClubApply);
        }

        const clubMember = await ClubMember.findOne({
            club: clubInfo._id,
            member: player._id
        });

        if (clubMember) {
            return player.replyFail(ClubAction.dealClubInviteRequest, TianleErrorCode.alreadyJoinClub);
        }

        const nJoinedClub = await ClubMember.count({
            member: player._id
        })

        if (nJoinedClub >= 5) {
            return player.replyFail(ClubAction.dealClubInviteRequest, TianleErrorCode.joinMaxClub);
        }

        await ClubMember.create({
            club: clubInfo._id,
            member: player._id,
            leader: clubRequest.partner
        })

        const adminList = await ClubMember.find({
            club: clubInfo._id,
            role: "admin"
        })

        // 发送邮件给战队主
        const ownerInfo = await service.playerService.getPlayerModel(clubInfo.owner);
        const playerInfo = await service.playerService.getPlayerModel(player._id);
        await notifyNewPlayerJoin(ownerInfo, clubInfo.name, clubInfo.shortId, partnerInfo, playerInfo);
        for (let i = 0; i < adminList.length; i++) {
            const adminInfo = await service.playerService.getPlayerModel(adminList[i].member);
            await notifyNewPlayerJoin(adminInfo, clubInfo.name, clubInfo.shortId, partnerInfo, playerInfo);
        }

        return player.replySuccess(ClubAction.dealClubInviteRequest, {});
    },
    [ClubAction.updatePlayerInfo]: async (player, message) => {
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

        const totalClubdIds = [...new Set([...player.model.joinClubShortIds, ...player.model.myClub])];
        // 获取是否有未读消息
        const unReadMessageIds = [];
        for (let i = 0; i < totalClubdIds.length; i++) {
            const clubShortId = totalClubdIds[i];
            const isAdmin = await playerIsAdmin(player.model._id, clubShortId);
            let messageLists = [];
            const clubMessageInfo = await ClubMessage.find({clubShortId, playerId: player.model._id, state: 1});
            messageLists = [...messageLists, ...clubMessageInfo];

            if (isAdmin) {
                const clubRequestInfo = await ClubRequest.find({clubShortId, type: 1, status: 0});
                const clubMergeInfo = await ClubMerge.find({fromClubId: clubShortId, status: 0});
                messageLists = [...messageLists, ...clubRequestInfo, ...clubMergeInfo];
            }

            if (messageLists.length > 0) {
                unReadMessageIds.push(clubShortId);
            }
        }


        player.sendMessage('club/updatePlayerInfoReply', {
            ok: true, data: {
                joinClubShortId: player.model.joinClubShortIds,
                myClub: player.model.myClub,
                unReadMessageIds
            }
        });
    },
    [ClubAction.recordList]: async (player, message) => {
        return getRecordListZD(player, message);
    },
    [ClubAction.recordRankList]: async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId});
        if (!club) {
            return player.sendMessage('club/recordRankListReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        let onlyShowMySelf = true;
        let isPartner = await playerIsPartner(player.model._id, message.clubShortId);
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (myClub || await playerIsAdmin(player.model._id, message.clubShortId)) {
            onlyShowMySelf = false;
        }

        return getRecordRankListByZD(player, message, onlyShowMySelf, isPartner);
    },
    [ClubAction.recordRoomPlayerInfo]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && (await playerIsAdmin(player.model._id, message.clubShortId) || await playerIsPartner(player.model._id, message.clubShortId))) {
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
                const events = record.events.filter(e => e.type === "shuffle");
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
            player.sendMessage('club/recordRoomPlayerInfoReply', {
                ok: true,
                data: {playerInfos, roomInfos, roomNum, gameType: message.gameType}
            });
            return;
        }
        player.sendMessage('club/recordRoomPlayerInfoReply', {ok: false, info: TianleErrorCode.noPermission});
    },
    [ClubAction.changeClubRecordState]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && (await playerIsAdmin(player.model._id, message.clubShortId) || await playerIsPartner(player.model._id, message.clubShortId))) {
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
    [ClubAction.seenClubRecords]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub && (await playerIsAdmin(player.model._id, message.clubShortId) || await playerIsPartner(player.model._id, message.clubShortId))) {
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
    [ClubAction.changeState]: async (player, message) => {
        const myClub = await Club.findOne({owner: player.model._id, shortId: message.clubShortId});

        if (myClub) {
            myClub.state = message.state
            await myClub.save()
            player.sendMessage('club/changeStateReply', {ok: true, data: {state: message.state}})
        } else {
            player.sendMessage('club/changeStateReply', {ok: false, info: TianleErrorCode.clubIsPause})
        }
    },
    [ClubAction.getClubMembers]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);
        const isPartner = await playerIsPartner(player.model._id, message.clubShortId);

        if (!myClub && (isAdmin || isPartner)) {
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

        const isClubOwner = myClub.owner === player._id.toString();
        const clubExtra = await getClubExtra(myClub._id);
        const clubMembers = await ClubMember.find(params);
        const clubMembersInfo = [];
        for (const clubMember of clubMembers) {
            const memberInfo = await PlayerModel.findOne({_id: clubMember.member})
            if (memberInfo) {
                if ((isPartner && !isAdmin && clubMember.leader === player.model.shortId) || isAdmin) {
                    clubMembersInfo.push({
                        name: memberInfo.nickname,
                        id: memberInfo._id,
                        isPartnerBlack: clubExtra.partnerBlacklist.includes(memberInfo._id.toString()),
                        isBlack: clubExtra.blacklist.includes(memberInfo._id.toString()),
                        rename: clubExtra.renameList[clubMember.member] || "",
                        partnerRename: clubExtra.partnerRenameList[clubMember.member] || "",
                        headImage: memberInfo.avatar,
                        diamond: memberInfo.diamond,
                        clubGold: clubMember.clubGold,
                        shortId: memberInfo.shortId,
                        isAdmin: clubMember.role === 'admin',
                        isPartner: clubMember.partner
                    })
                }
            }
        }

        player.sendMessage('club/getClubMembersReply', {ok: true, data: {isClubOwner, isAdmin, isPartner, clubMembersInfo}});
    },
    [ClubAction.checkPlayerIsBlack]: async (player, message) => {
        let myClub = await Club.findOne({shortId: message.clubShortId});
        const clubExtra = await getClubExtra(myClub._id);
        const isBlack = clubExtra.blacklist.includes(player._id.toString())


        player.sendMessage('club/checkPlayerIsBlackReply', {ok: true, data: {black: isBlack}});
    },
    [ClubAction.getClubPartner]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.sendMessage('club/getClubPartnerReply', {ok: false, info: TianleErrorCode.notClubAdmin});
        }

        const minDate = new Date();
        minDate.setHours(0);
        minDate.setMinutes(0);
        minDate.setSeconds(0);
        minDate.setMilliseconds(0);
        minDate.setDate(minDate.getDate() - await getPartnerDate(message.type));

        const params = {club: myClub._id, partner: true};
        if (message.playerShortId) {
            const searchInfo = await PlayerModel.findOne({shortId: message.playerShortId});
            params["member"] = searchInfo._id;
        }
        const clubExtra = await getClubExtra(myClub._id);
        const clubMembers = await ClubMember.find(params);
        const clubPartnerInfo = [];
        const gameCount =  {
            [GameType.zd]: 0,
            [GameType.ddz]: 0,
            [GameType.guandan]: 0,
            [GameType.pcmj]: 0,
            [GameType.xmmj]: 0,
        }
        let totalGameJuCount = 0;

        for (const clubMember of clubMembers) {
            const memberInfo = await PlayerModel.findOne({_id: clubMember.member})
            if (memberInfo) {
                const gameJuCount = await getRoomCountByGame(myClub, memberInfo, minDate);
                const gameJuCountKeys = Object.keys(gameJuCount);

                for (let i = 0; i < gameJuCountKeys.length; i++) {
                    gameCount[gameJuCountKeys[i]] += gameJuCount[gameJuCountKeys[i]];
                }

                clubPartnerInfo.push({
                    name: memberInfo.nickname,
                    id: memberInfo._id,
                    isBlack: clubExtra.blacklist.includes(memberInfo._id.toString()),
                    rename: clubExtra.renameList[clubMember.member] || "",
                    headImage: memberInfo.avatar,
                    shortId: memberInfo.shortId,
                    isAdmin: clubMember.role === 'admin',
                    gameJuCount
                })
            }
        }

        const gameJuCountKeys = Object.keys(gameCount);

        for (let i = 0; i < gameJuCountKeys.length; i++) {
            totalGameJuCount += gameCount[gameJuCountKeys[i]];
        }

        player.sendMessage('club/getClubPartnerReply', {ok: true, data: {clubPartnerInfo, total: {...gameCount, totalGameJuCount}}});
    },
    [ClubAction.renameClubPlayer]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);
        const isPartner = await playerIsPartner(player.model._id, message.clubShortId);
        if (!myClub && (isAdmin || isPartner)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (!myClub) {
            return player.sendMessage('club/renameClubPlayerReply', {ok: false, info: TianleErrorCode.notClubAdmin});
        }

        const membership = await ClubMember.findOne({club: myClub._id, member: message.playerId});
        if (!membership) {
            return player.sendMessage('club/renameClubPlayerReply', {ok: false, info: TianleErrorCode.notClubPlayer});
        }

        // 做管理员的校验
        if (isAdmin) {
            if (membership.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (message.playerId === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        // 做合伙人的校验
        if (isPartner) {
            if (membership.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (membership.partner) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemovePartner
                });
            }

            if (membership.leader !== player.model.shortId) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveLeader
                });
            }

            if (message.playerId.toString() === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        const clubExtra = await getClubExtra(myClub._id);
        // 如果是合伙人，设置合伙人备注
        if (isPartner && membership.leader === player.model.shortId) {
            const renameList = clubExtra.partnerRenameList;
            renameList[message.playerId] = message.rename;
            await ClubExtra.update({clubId: myClub._id}, {$set: {partnerRenameList: renameList}})
        } else {
            const renameList = clubExtra.renameList;
            renameList[message.playerId] = message.rename;
            await ClubExtra.update({clubId: myClub._id}, {$set: {renameList}})
        }

        player.sendMessage('club/renameClubPlayerReply', {ok: true, data: {}});
    },
    [ClubAction.rename]: async (player, message) => {
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.replyFail(ClubAction.rename, TianleErrorCode.noPermission);
        }
        const playerInfo = await PlayerModel.findOne({_id: player.model._id})
        // 检查房卡
        const renameConfig = await GlobalConfig.findOne({name: "renameClubDiamond"}).lean();
        const requiredDiamond = renameConfig ? Number(renameConfig.value) : 200;
        if (playerInfo.diamond < requiredDiamond && myClub.freeRenameCount === 0) {
            return player.replyFail(ClubAction.rename, TianleErrorCode.diamondInsufficient);
        }

        if (!message.newClubName || message.newClubName.length > config.club.maxNameLength) {
            return player.replyFail(ClubAction.rename, TianleErrorCode.invalidName);
        }

        // 保存新名字
        const oldName = myClub.name;
        myClub.name = message.newClubName;
        await myClub.save();

        if (playerInfo.freeRenameCount > 0) {
            await PlayerModel.update({_id: player.model._id}, {$inc: {freeRenameCount: -1}}).exec();
        } else {
            await PlayerModel.update({_id: player.model._id}, {$inc: {diamond: -requiredDiamond}}).exec();
        }

        player.replySuccess(ClubAction.rename, {diamond: playerInfo.diamond - requiredDiamond, clubName: myClub.name});
        await player.updateResource2Client();
        // 添加日志
        await logRename(myClub._id, oldName, myClub.name, playerInfo._id);
    },
    [ClubAction.transfer]: async (player, message) => {
        const myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.replyFail(ClubAction.transfer, TianleErrorCode.noPermission);
        }
        const playerInfo = await PlayerModel.findOne({_id: player.model._id});
        // 检查房卡
        const outConfig = await GlobalConfig.findOne({name: "transferOutDiamond"}).lean();
        const outDiamond = outConfig ? Number(outConfig.value) : 500;
        if (playerInfo.diamond < outDiamond) {
            return player.replyFail(ClubAction.transfer, TianleErrorCode.diamondInsufficient);

        }
        // 转入的房卡
        const inConfig = await GlobalConfig.findOne({name: "transferInDiamond"}).lean();
        const inDiamond = inConfig ? Number(inConfig.value) : 500;
        // 接收人
        const transferee = await PlayerModel.findOne({shortId: message.toShortId});
        if (!transferee) {
            player.replyFail(ClubAction.transfer, TianleErrorCode.playerNotExists);
            return
        }
        if (transferee.diamond < inDiamond) {
            player.replyFail(ClubAction.transfer, TianleErrorCode.tranferInPlayerDiamondInsufficient);
            return
        }
        if (transferee.shortId === playerInfo.shortId) {
            player.replyFail(ClubAction.transfer, TianleErrorCode.transferClubSamePlayer);
            return
        }
        const hasClub = await Club.findOne({owner: transferee._id});
        if (hasClub) {
            return player.replyFail(ClubAction.transfer, TianleErrorCode.alreadyCreateClub);
        }
        // 保存
        myClub.owner = transferee._id;
        await myClub.save();
        await PlayerModel.update({_id: player.model._id}, {$set: {diamond: playerInfo.diamond - outDiamond}}).exec();
        await PlayerModel.update({_id: transferee._id}, {$set: {diamond: transferee.diamond - inDiamond}}).exec();
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
            await ClubMember.update({club: myClub._id, member: member._id}, {$set: {role: null}}).exec();
        }
        if (member && member.partner) {
            await ClubMember.update({club: myClub._id, member: member._id}, {$set: {partner: false}}).exec();
        }

        // 如果在黑名单，取消黑名单
        const clubExtra = await getClubExtra(myClub._id);
        let blacklist = clubExtra.blacklist;
        blacklist = blacklist.filter(x => x !== transferee._id.toString());
        clubExtra.blacklist = blacklist;
        await clubExtra.save();

        player.replySuccess(ClubAction.transfer, {diamond: playerInfo.diamond - outDiamond});
        await player.updateResource2Client();
        // 通知被转移人
        await notifyTransfer(playerInfo, transferee, myClub.name, myClub.shortId);
        // 添加日志
        await logTransfer(myClub._id, playerInfo._id, transferee._id);
    },
    [ClubAction.operateBlackList]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);
        const isPartner = await playerIsPartner(player.model._id, message.clubShortId);
        if (!myClub && (isAdmin || isPartner)) {
            myClub = await Club.findOne({shortId: message.clubShortId});
        }

        if (!myClub) {
            return player.sendMessage('club/operateBlackListReply', {ok: false, info: TianleErrorCode.notClubAdmin});
        }
        if (myClub.owner === message.playerId) {
            return player.sendMessage('club/operateBlackListReply', {ok: false, info: TianleErrorCode.notOperateClubCreator});
        }

        const memberShip = await ClubMember.findOne({club: myClub._id, member: message.playerId});
        if (!memberShip) {
            return player.sendMessage('club/renameClubPlayerReply', {ok: false, info: TianleErrorCode.notClubPlayer});
        }

        // 做管理员的校验
        if (isAdmin) {
            if (memberShip.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (message.playerId === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        // 做合伙人的校验
        if (isPartner) {
            if (memberShip.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (memberShip.partner) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemovePartner
                });
            }

            if (memberShip.leader !== player.model.shortId) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveLeader
                });
            }

            if (message.playerId.toString() === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        const clubExtra = await getClubExtra(myClub._id);
        if (isPartner && memberShip.leader === player.model.shortId) {
            if (message.operate === 'add') {
                clubExtra.partnerBlacklist.push(message.playerId);
            } else {
                clubExtra.partnerBlacklist = clubExtra.partnerBlacklist.filter(x => x !== message.playerId);
            }
        } else {
            if (message.operate === 'add') {
                clubExtra.blacklist.push(message.playerId);
            } else {
                clubExtra.blacklist = clubExtra.blacklist.filter(x => x !== message.playerId);
            }
        }
        await clubExtra.save();

        player.sendMessage('club/operateBlackListReply', {ok: true, data: {}});
    },
    [ClubAction.removePlayer]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        let roleType = myClub ? 1 : -1;
        const isAdmin = await playerIsAdmin(player.model._id, message.clubShortId);
        const isPartner = await playerIsPartner(player.model._id, message.clubShortId);
        if (!myClub) {
            if (isAdmin) {
                roleType = 2;
                myClub = await Club.findOne({shortId: message.clubShortId});
            }

            if (isPartner) {
                roleType = 3;
                myClub = await Club.findOne({shortId: message.clubShortId});
            }
        }

        const memberShip = await ClubMember.findOne({club: myClub._id, member: message.playerId}).lean()

        if (!myClub) {
            return player.sendMessage('club/removePlayerReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        if (myClub.owner === message.playerId.toString()) {
            return player.sendMessage('club/removePlayerReply', {
                ok: false,
                info: TianleErrorCode.notOperateClubCreator
            });
        }

        // 做管理员的校验
        if (roleType === 2) {
            if (memberShip.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (message.playerId === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        // 做合伙人的校验
        if (roleType === 3) {
            if (memberShip.role === 'admin') {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveAdmin
                });
            }

            if (memberShip.partner) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemovePartner
                });
            }

            if (memberShip.leader !== player.model.shortId) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveLeader
                });
            }

            if (message.playerId.toString() === player._id.toString()) {
                return player.sendMessage('club/adminRemovePlayerReply', {
                    ok: false,
                    info: TianleErrorCode.notRemoveSelf
                });
            }
        }

        if (memberShip.partner) {
            // 记录被踢出的用户列表
            const leavePlayers = [{member: message.playerId, roleType: 1}];
            const playerInfo = await service.playerService.getPlayerModel(message.playerId);

            // 获取合伙人
            const clubTeamList = await ClubMember.find({club: myClub._id, leader: playerInfo.shortId});
            for (let i = 0; i < clubTeamList.length; i++) {
                leavePlayers.push({member: clubTeamList[i].member, roleType: 2});
                await ClubMember.remove({member: clubTeamList[i].member, club: myClub._id});
            }

            // 给合伙人和用户创建新的战队
            if (leavePlayers.length > 1) {
                await createNewClub(playerInfo, leavePlayers);
            }
        }

        await ClubMember.remove({member: message.playerId, club: myClub._id})
        player.sendMessage('club/removePlayerReply', {ok: true, data: {}});
    },
    [ClubAction.promoteAdmin]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.clubShortId);
        if (!myClub) {
            return player.sendMessage('club/promoteAdminReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        const member = await PlayerModel.findOne({shortId: message.playerShortId});
        const memberShip = await ClubMember.findOne({club: myClub._id, member: member._id});

        if (myClub.owner.toString() === member._id.toString()) {
            return player.sendMessage('club/promoteAdminReply', {
                ok: false,
                info: TianleErrorCode.notOperateClubCreator
            });
        }
        if (!memberShip) {
            return player.sendMessage('club/promoteAdminReply', {ok: false, info: TianleErrorCode.notClubMember})
        }

        memberShip.role = message.role === "add" ? 'admin' : null;
        await memberShip.save();
        return player.sendMessage('club/promoteAdminReply', {ok: true, data: {}})
    },
    [ClubAction.promotePartner]: async (player, message) => {
        let isOwner = await getOwnerClub(player.model._id, message.clubShortId);
        if (!isOwner) {
            return player.sendMessage('club/promotePartnerReply', {ok: false, info: TianleErrorCode.noPermission});
        }

        const club = await Club.findOne({shortId: message.clubShortId});
        const member = await PlayerModel.findOne({shortId: message.playerShortId});
        const memberShip = await ClubMember.findOne({club: club._id, member: member._id});

        if (!memberShip) {
            return player.sendMessage('club/promotePartnerReply', {ok: false, info: TianleErrorCode.notClubMember})
        }
        if (club.owner.toString() === member._id.toString()) {
            return player.sendMessage('club/promotePartnerReply', {ok: false, info: TianleErrorCode.notOperateClubCreator})
        }

        memberShip.partner = message.type === "add";
        await memberShip.save();
        return player.sendMessage('club/promotePartnerReply', {ok: true, data: {}})
    },
    [ClubAction.createNewClub]: async (player, message) => {
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
                return player.sendMessage('club/createNewClubReply', {ok: false, info: TianleErrorCode.systemError})
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
            return player.replyFail(ClubAction.editRule, TianleErrorCode.ruleNotExist);
        }
        const isOk = await hasRulePermission(result.clubId, player.model._id);
        if (!isOk) {
            return player.replyFail(ClubAction.editRule, TianleErrorCode.noPermission);
        }
        const rule = message.rule;
        // 人数不可更改
        rule.playerCount = result.playerCount;
        delete rule.ruleId;
        result.rule = rule;
        await result.save();

        await requestToAllClubMember(player.channel, 'club/updateClubRoom', result.clubId.toString(), {})

        player.replySuccess(ClubAction.editRule, rule);
    },
    [ClubAction.addRule]: async (player, message) => {
        const clubShortId = message.clubShortId;
        const gameType = message.gameType;
        const ruleType = message.ruleType;
        const rule = message.rule;
        const playerCount = rule.playerCount;
        const club = await Club.findOne({shortId: clubShortId});
        if (!club) {
            return player.replyFail(ClubAction.addRule, TianleErrorCode.clubNotExists);
        }

        const isOk = await hasRulePermission(club._id, player.model._id);
        if (!isOk) {
            return player.replyFail(ClubAction.addRule, TianleErrorCode.noPermission);
        }

        // 根据玩家数查找规则
        const find = await ClubRuleModel.findOne({
            clubId: club._id,
            gameType,
            ruleType,
            playerCount,
            "rule.juShu": rule.juShu
        });
        if (find) {
            return player.replyFail(ClubAction.addRule, TianleErrorCode.ruleIsExist);
        }

        const {model} = await createClubRule(club._id, gameType, playerCount, ruleType, rule);

        await requestToAllClubMember(player.channel, 'club/updateClubRoom', club._id.toString(), {})

        // @ts-ignore
        player.replySuccess(ClubAction.addRule, {...model.rule, ruleId: model._id.toString()})
    },
    [ClubAction.ruleList]: async (player, message) => {
        const club = await Club.findOne({shortId: message.clubShortId});
        if (!club) {
            return player.replyFail(ClubAction.ruleList, TianleErrorCode.clubNotExists);
        }

        const clubRule = await getClubRule(club, message.gameType);
        player.replySuccess(ClubAction.ruleList, clubRule)
    },
    [ClubAction.deleteRule]: async (player, message) => {
        const result = await ClubRuleModel.findById(message.ruleId);
        if (!result) {
            player.replyFail(ClubAction.deleteRule, TianleErrorCode.ruleNotExist);
            return;
        }
        const isOk = await hasRulePermission(result.clubId, player.model._id);
        if (!isOk) {
            player.replyFail(ClubAction.deleteRule, TianleErrorCode.noPermission);
            return;
        }

        await result.remove();

        await requestToAllClubMember(player.channel, 'club/updateClubRoom', result.clubId.toString(), {})

        player.replySuccess(ClubAction.deleteRule, result);
    },
    [ClubAction.deleteMessage]: async (player, message) => {
        let result = null;

        if (message.type === 1) {
            result = await ClubRequest.findById(message._id);
        }
        if (message.type === 2) {
            result = await ClubMerge.findById(message._id);
        }
        if (message.type === 4) {
            result = await ClubMessage.findById(message._id);
        }
        if (!result) {
            return  player.replyFail(ClubAction.deleteMessage, TianleErrorCode.systemError);
        }

        const clubInfo = await Club.findOne({shortId: message.clubShortId});

        const isOk = await hasRulePermission(clubInfo._id, player.model._id);
        if (!isOk) {
            player.replyFail(ClubAction.deleteMessage, TianleErrorCode.noPermission);
            return;
        }

        await result.remove();

        player.replySuccess(ClubAction.deleteMessage, {});
    },
    [ClubAction.readMessage]: async (player, message) => {
        const result = await ClubMessage.findById(message._id);
        if (!result) {
            return player.replyFail(ClubAction.readMessage, TianleErrorCode.systemError);
        }

        result.state = 2;
        await result.save();

        player.replySuccess(ClubAction.readMessage, {});
    },
    [ClubAction.clubConfig]: async (player) => {
        const renameClubConfig = await GlobalConfig.findOne({name: "renameClubDiamond"}).lean();
        const renameDiamond = renameClubConfig ? Number(renameClubConfig.value) : 200;
        const outConfig = await GlobalConfig.findOne({name: "transferOutDiamond"}).lean();
        const outDiamond = outConfig ? Number(outConfig.value) : 500;
        const inConfig = await GlobalConfig.findOne({name: "transferInDiamond"}).lean();
        const inDiamond = inConfig ? Number(inConfig.value) : 500;
        const applyClubConfig = await GlobalConfig.findOne({name: "applyClubDiamond"}).lean();
        const applyDiamond = applyClubConfig ? Number(applyClubConfig.value) : 100;
        const mergeClubConfig = await GlobalConfig.findOne({name: "mergeClubDiamond"}).lean();
        const mergeDiamond = mergeClubConfig ? Number(mergeClubConfig.value) : 200;

        player.replySuccess(ClubAction.clubConfig, {
            apply: applyDiamond,
            rename: renameDiamond,
            transferOut: outDiamond,
            transferIn: inDiamond,
            merge: mergeDiamond
        });
    },
    [ClubAction.mergeClub]: async (player, message) => {
        let myClub = await getOwnerClub(player.model._id, message.mergeToClubId);
        if (!myClub) {
            return player.replyFail(ClubAction.mergeClub, TianleErrorCode.noPermission);
        }

        const clubMerge = await ClubMerge.findOne({
            fromClubId: message.mergeFromClubId,
            toClubId: message.mergeToClubId,
            status: 0
        });
        if (clubMerge) {
            return player.replyFail(ClubAction.request, TianleErrorCode.alreadyApplyMergeClub);
        }

        // 查询想要合并的战队
        const mergeFromClub = await Club.findOne({shortId: message.mergeFromClubId});
        if (!mergeFromClub) {
            return player.replyFail(ClubAction.mergeClub, TianleErrorCode.clubNotExists);
        }

        //生成审核记录
        await requestToAllClubMember(player.channel, 'clubRequest', mergeFromClub._id, {});

        const result = await ClubMerge.create({
            fromClubId: mergeFromClub.shortId,
            toClubId: myClub.shortId,
            fromClubName: mergeFromClub.name,
            toClubName: myClub.name,
            type: 2
        });

        return player.replySuccess(ClubAction.mergeClub, result);
    },
    [ClubAction.inviteNormalPlayer]: async (player, message) => {
        const isPartner = await playerIsPartner(player.model._id, message.clubShortId);
        if (!isPartner) {
            return player.replyFail(ClubAction.inviteNormalPlayer, TianleErrorCode.noPermission);
        }

        const playerInfo = await Player.findOne({shortId: message.playerShortId});
        const alreadyJoinedClubs = await ClubMember.count({member: playerInfo._id}).lean()

        if (alreadyJoinedClubs >= 5) {
            return player.replyFail(ClubAction.inviteNormalPlayer, TianleErrorCode.joinMaxClub);
        }

        const clubRequest = await ClubRequest.findOne({
            playerId: playerInfo._id,
            clubShortId: message.clubShortId,
            status: 0
        });
        if (clubRequest) {
            return player.replyFail(ClubAction.inviteNormalPlayer, TianleErrorCode.alreadyApplyClub);
        }

        const haveThisClub = await Club.findOne({shortId: message.clubShortId})
        if (!haveThisClub) {
            return player.replyFail(ClubAction.inviteNormalPlayer, TianleErrorCode.clubNotExists);
        }

        const clubMember = await ClubMember.findOne({
            club: haveThisClub._id,
            member: playerInfo._id
        });

        if (clubMember) {
            return player.replyFail(ClubAction.inviteNormalPlayer, TianleErrorCode.alreadyJoinClub);
        }

        await requestToUserCenter(player.channel, 'club/invitePlayerMessage', playerInfo._id, {playerId: playerInfo._id})

        const record = await ClubRequest.create({
            playerId: playerInfo._id,
            clubShortId: message.clubShortId,
            avatar: playerInfo.avatar,
            playerShortId: playerInfo.shortId,
            playerName: playerInfo.nickname,
            type: 3,
            partner: player.model.shortId
        });

        return player.replySuccess(ClubAction.inviteNormalPlayer, record);
    },
}

// 邮件通知战队解散
async function clubDisbandMessage(clubName, clubId, playerId) {
    const clubOwnerInfo = await Player.findOne({_id: playerId});
    await clubMessage.create({
        playerId: playerId,
        clubShortId: clubId,
        playerName: clubOwnerInfo.nickname,
        avatar: clubOwnerInfo.avatar,
        playerShortId: clubOwnerInfo.shortId,
        message: `您的战队${clubName}(${clubId})已解散!`
    });
}

// 邮件通知成员合并失败
async function mergeFailClubMessage(clubName, clubId, playerId, alreadyJoinClubs) {
    let msg = '';
    for (let i = 0; i < alreadyJoinClubs.length; i++) {
        const detail = await service.playerService.getPlayerModel(alreadyJoinClubs[i]);
        msg += `${detail.shortId}(${detail.nickname})、`;
    }
    msg = msg.slice(0, msg.length - 1);

    const clubOwnerInfo = await Player.findOne({_id: playerId});
    await clubMessage.create({
        playerId: playerId,
        clubShortId: clubId,
        playerName: clubOwnerInfo.nickname,
        avatar: clubOwnerInfo.avatar,
        playerShortId: clubOwnerInfo.shortId,
        message: `${msg}已在本战队${clubName}(${clubId})`
    });
}

// 邮件通知拒绝成员加入
async function refuseNewPlayerJoin(clubName, clubId, playerInfo) {
    const mail = new MailModel({
        to: playerInfo._id,
        type: MailType.MESSAGE,
        title: '拒绝加入通知',
        content: `${playerInfo.nickname}(${playerInfo.shortId})申请加入战队${clubName}(${clubId})被管理员拒绝`,
        state: MailState.UNREAD,
        createAt: new Date(),
        gift: {diamond: 0, tlGold: 0, gold: 0}
    })
    await mail.save();
}

// 邮件通知新成员加入
async function notifyNewPlayerJoin(ownerInfo, clubName, clubId, partnerInfo, playerInfo) {
    const mail = new MailModel({
        to: ownerInfo._id,
        type: MailType.MESSAGE,
        title: '成员加入通知',
        content: `${playerInfo.nickname}(${playerInfo.shortId})接受合伙人${partnerInfo.nickname}(${partnerInfo.shortId})邀请成功加入战队${clubName}(${clubId})`,
        state: MailState.UNREAD,
        createAt: new Date(),
        gift: {diamond: 0, tlGold: 0, gold: 0}
    })
    await mail.save();
}

// 邮件通知战队转移
async function notifyTransfer(oldOwner, newOwner, clubName, clubId) {
    const mail = new MailModel({
        to: newOwner._id,
        type: MailType.MESSAGE,
        title: '战队转移通知',
        content: `${oldOwner.nickname}(${oldOwner.shortId})将战队${clubName}(${clubId})转移给您`,
        state: MailState.UNREAD,
        createAt: new Date(),
        gift: {diamond: 0, tlGold: 0, gold: 0}
    })
    await mail.save();
}

/**
 * 获取 club 规则
 * @param club club model
 * @param gameType
 */
async function getClubRule(club, gameType = null) {
    const publicRule = [];
    const goldRule = [];
    const params = {clubId: club._id};
    if (gameType) {
        params["gameType"] = gameType;
    }

    const result = await ClubRuleModel.find(params);
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

// 是否有权限更改规则
async function hasRulePermission(clubId, playerId) {
    // 检查是否创建者、管理员
    const myClub = await Club.findById(clubId);
    if (!myClub) {
        // 俱乐部不存在
        return false;
    }
    console.warn("owner-%s playerId-%s status-%s", myClub.owner, playerId, myClub.owner === playerId.toString());
    if (myClub.owner === playerId.toString()) {
        // 创建者
        return true;
    }
    const member = await ClubMember.findOne({club: clubId, member: playerId});
    // 是成员且为管理员
    return member && member.role === 'admin';
}

async function getPartnerDate(type) {
    if (type === 1) {
        return 0;
    }

    if (type === 2) {
        const minDate = new Date();
        return minDate.getDay();
    }

    if (type === 3) {
        const minDate = new Date();
        return minDate.getDate() - 1;
    }
}

async function getRoomCountByGame(club, member, minDate) {

    const params = {
        club: club._id, scores: {$ne: []}, createAt: {$gt: minDate}
    }

    const records = await RoomRecord
        .find(params)
        .sort({createAt: -1})
        .lean()
        .exec();

    const gameCount =  {
        [GameType.zd]: 0,
        [GameType.ddz]: 0,
        [GameType.guandan]: 0,
        [GameType.pcmj]: 0,
        [GameType.xmmj]: 0,
    }

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        const recordIndex = record.scores.findIndex(s => s && s.shortId === member.shortId);

        if (recordIndex !== -1) {
            gameCount[record.category]++;
        }
    }

    return gameCount;
}

async function getRecordRankListByZD(player, message: any, onlyShowMySelf, isPartner) {
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
            .exec();
        const rankData = [];
        const totalStatistic = {};
        let currentDate = new Date(Date.now());
        let detailData = [];
        const clubMembers = await ClubMember.find({club: club._id})
            .populate('member').lean();
        for (const clubMember of clubMembers) {
            if (clubMember.member) {
                detailData = [];
                for (let i = 0; i < 3; i++) {
                    currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * i);
                    detailData.push({
                        time: currentDate.toLocaleDateString(),
                        // 大赢家次数
                        bigWinnerCount: 0,
                        bigWinnerRoomIds: [],
                        roomJuCount: 0,
                        juData: {
                            club: {
                                normal: 0,
                            },
                            person: {
                                normal: 0,
                            }
                        },
                        scoreData: {
                            club: {
                                normal: 0
                            },
                            person: {
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
                } else if (isPartner) {
                    if (clubMember && clubMember.leader === player.model.shortId) {
                        rankData.push(pData);
                    }
                } else {
                    rankData.push(pData);
                }
            }
        }
        for (const r of records) {
            const isPerson = r.rule.clubPersonalRoom;
            const roomTime = new Date(r.createAt).toLocaleDateString();
            if (!totalStatistic[roomTime]) {
                totalStatistic[roomTime] = {
                    juShu: 0,
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
            totalStatistic[roomTime]['juShu']++;

            if (r.juIndex && r.juIndex === 1) {
                // 一局内解散
                totalStatistic[roomTime].dissolveRoom++;
            }
            const juAdd = function (x) {
                if (isPerson) {
                    x.juData.person.normal += 1;
                } else {
                    x.roomJuCount += 1;
                    x.juData.club.normal += 1;
                }
            }
            const scoreAdd = function (x, score) {
                if (isPerson) {
                    x.scoreData.person.normal += score;
                } else {
                    x.scoreData.club.normal += score;
                }
            }
            for (const d of r.scores) {
                const joinPlayerInfo = await Player.findOne({shortId: d.shortId});
                const clubMermber = await ClubMember.findOne({club: club._id, member: joinPlayerInfo._id});
                // score 不为空
                if (!d || (onlyShowMySelf && d.shortId !== player.model.shortId) || (isPartner && clubMermber && clubMermber.leader === player.model.shortId)) {
                    continue;
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
                                normal: 0,
                            },
                            person: {
                                normal: 0,
                            }
                        },
                        scoreData: {
                            club: {
                                normal: 0
                            },
                            person: {
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
                // 有局数
                pData.detailData.forEach(x => {
                    if (roomTime === x.time) {
                        juAdd(x);
                    }
                })
            }
        }

        return player.sendMessage('club/recordRankListReply', {ok: true, data: {rankData, summary: totalStatistic}});
    }
    player.sendMessage('club/recordRankListReply', {ok: false, info: TianleErrorCode.noPermission});
}

// 排行明细
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
    const isClubPartner = await playerIsPartner(player.model.shortId, message.clubShortId);
    const formatted = [];
    for (const record of records) {
        let isMyRecord = false;
        let isTeamRecord = false;
        let maxScore = 0;
        let winnerIndex = 0;
        for (let i = 0; i < record.scores.length; i++) {
            const scoreInfo = record.scores[i];
            if (scoreInfo && scoreInfo.score > maxScore) {
                maxScore = record.scores[i].score;
                winnerIndex = i;
            }
        }
        const scores = [];
        for (const score of record.scores) {
            if (score.shortId === player.model.shortId) {
                isMyRecord = true;
            }

            const joinPlayerInfo = await Player.findOne({shortId: score.shortId});
            const clubMermber = await ClubMember.findOne({club: club._id, member: joinPlayerInfo._id});
            if (clubMermber && clubMermber.leader === player.model.shortId && isClubPartner) {
                isTeamRecord = true;
            }

            scores.push({
                ...score,
                // 备注名
                commentName: score && nameMap[score.shortId] || '',
            })
        }

        // 普通用户，查看自己的记录，合伙人，查看下级的记录，管理员，查看所有人的记录
        if (isMyRecord || isClubOwnerOAdmin || isTeamRecord) {
            formatted.push({
                _id: record.room,
                roomId: record.roomNum,
                time: record.createAt.getTime(),
                creatorId: record.creatorId,
                players: scores,
                winner: winnerIndex,
                rule: record.rule,
                roomState: record.roomState,
                checked: record.checked,
                seen: record.seen,
            })
        }
    }
    return player.sendMessage('club/recordListReply', {ok: true, data: {records: formatted}});
}
