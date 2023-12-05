import {ConsumeLogType, GameType, GameTypeList, RedisKey, RuleType} from "@fm/common/constants";
import {Errors, GameError} from "@fm/common/errors";
import * as moment from "moment/moment";
import * as config from "../../config";
import {getNewShortClubId} from "../../database/init";
import Club from "../../database/models/club";
import ClubExtra from "../../database/models/clubExtra";
import ClubGoldRecord from "../../database/models/clubGoldRecord";
import ClubMember from "../../database/models/clubMember";
import ClubRequest from "../../database/models/clubRequest";
import ClubRoomRecordModel from "../../database/models/clubRoomRecord";
import ClubRuleModel from "../../database/models/clubRule";
import ClubUnionRequest from "../../database/models/clubUnionRequest";
import GameRecord from "../../database/models/gameRecord";
import {MailModel, MailState, MailType} from "../../database/models/mail";
import PlayerModel from "../../database/models/player";
import {RoomInfoModel} from "../../database/models/roomInfo";
import RoomRecord from "../../database/models/roomRecord";
import {service} from "../../service/importService";
import createClient from "../../utils/redis";
import PlayerManager from "../player-manager";
import {addApi, BaseApi} from "./baseApi";

export class NewClub extends BaseApi {

  // 创建新战队
  @addApi()
  async createNewClub(message: any) {
    const playerId = this.player.model._id;
    const ownerClub = await Club.findOne({owner: playerId});
    if (ownerClub) {
      // 只能创建一个战队
      return this.replyFail('您已有战队！')
    }
    const joinedClub = await ClubMember.count({member: playerId})
    if (joinedClub >= 5) {
      return this.replyFail('您已经加入了5个战队,不能再创建战队了！')
    }

    if (!message.clubName) {
      return this.replyFail('战队名称设置有误')
    }

    const playerInfo = await PlayerModel.findOne({_id: playerId})
    this.player.model.gem = playerInfo.gem
    if (this.player.model.gem < config.club.gemForCreateClub) {
      return this.replyFail(`您的钻石不足${config.club.gemForCreateClub}张，无法创建战队`)
    }
    if (!this.player.model.phone) {
      return this.replyFail('请在大厅内先完成手机绑定，然后再创建战队')
    }

    if (await Club.findOne({name: message.clubName})) {
      return this.replyFail('与其它战队名称重复，请更换调整名称重试！')
    }
    const clubShortId = await getNewShortClubId();
    try {
      const club = await Club.create({
        owner: playerId,
        shortId: clubShortId,
        name: message.clubName,
      })
      await service.club.addClubMember(club._id, playerId, club.shortId);
      return this.replySuccessWithInfo(`战队${clubShortId}创建成功`)
    } catch (e) {
      this.logger.error(e);
      return this.replyFail('战队创建失败')
    }
  }

  // 提交加入请求
  @addApi({apiName: 'request'})
  async joinRequest(message: any) {
    const clubRequest = await ClubRequest.findOne({
      playerId: this.player.id,
      clubShortId: message.clubShortId,
    });
    if (clubRequest) {
      return this.replyFail('已提交过申请！');
    }
    const commonCheck = await service.club.isCanJoinClub(message.clubShortId, this.player.model._id);
    if (!commonCheck.isOk) {
      return this.replyFail(commonCheck.info);
    }
    // 通知战队成员
    await this.broadcastAdminAndOwner(commonCheck.club, 'club/haveRequest', {});
    await ClubRequest.create({
      playerId: this.player.model._id,
      clubShortId: message.clubShortId,
      headImage: this.player.model.headImgUrl || "http://wx.qlogo.cn/mmopen/vi_32/" +
        "PiajxSqBRaEIrBEU3kqpPyp5DaY7bibfhEic2CuWdDFEjN9UJqcPeKmvhmK8RVLfjiaM2oKicAgrMNY0AicuSkZPR2ibQ/0",
      playerShortId: this.player.model.shortId,
      playerName: this.player.model.name,
      })
    this.replySuccessWithInfo('成功提交申请！');
  }

  // 处理加入请求
  @addApi()
  async dealRequest(message: any) {
    const club = await Club.findOne({shortId: message.clubShortId})
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    const isClubOwner = myClub && myClub.shortId === message.clubShortId;
    const memberShip = await ClubMember.findOne({club: club._id, member: this.player.model._id}).lean();
    const isAmin = memberShip.role === 'admin'
    if (isClubOwner || isAmin) {
      await ClubRequest.remove({
        playerId: message.requestId,
        clubShortId: message.clubShortId
      });
      if (message.refuse) {
        return this.replyFail('已拒绝玩家请求！');
      }
      const commonCheck = await service.club.isCanJoinClub(message.clubShortId, message.requestId);
      if (!commonCheck.isOk) {
        return this.replyFail(commonCheck.info);
      }
      // const clubMember = await ClubMember.findOne({
      //   club: myClub._id,
      //   member: message.requestId
      // });
      //
      // if (clubMember) {
      //   return this.replyFail('该玩家已加入战队！');
      // }
      //
      // const nJoinedClub = await ClubMember.count({
      //   member: message.requestId
      // })
      //
      // if (nJoinedClub >= 5) {
      //   return this.replyFail('该玩家已经加入5个战队,不能再加入其它战队');
      // }
      await service.club.addClubMember(myClub._id, message.requestId, myClub.shortId);
      return this.replySuccessWithInfo('加入玩家成功！');
    }
    return this.replyFail('处理失败！');
  }

  // 获取俱乐部信息
  @addApi()
  async getClubInfo(message: any) {
    const tempClub = await Club.findOne({shortId: message.clubShortId});
    const clubId = tempClub ? tempClub._id.toString() : ''
    let playerClub = await this.getPlayerClub(this.player.model._id, clubId);
    const unionClub = await ClubMember.findOne({
      unionClubShortId: message.clubShortId,
      member: this.player.model._id,
    });
    if (!playerClub && !unionClub) {
      // 未加入该战队或者联盟该战队
      return this.replyFailWithInfo('非战队玩家', {roomInfo: [], clubInfo: {}});
    }
    if (!playerClub) {
      playerClub = await Club.findOne({
        shortId: message.clubShortId,
      });
    }
    const allClubMemberShips = await ClubMember.find({member: this.player.id.toString()}).populate('club');
    const clubs = allClubMemberShips.map(cm => cm.club)
    // 查找该战队加入的联盟战队
    const unionClubShortIdList = [];
    const clubsMap = service.utils.array2map(clubs, 'shortId');
    allClubMemberShips.forEach(cm => {
      if (cm.unionClubShortId && !clubsMap[cm.unionClubShortId]) {
        unionClubShortIdList.push(cm.unionClubShortId);
        if (clubsMap[cm.clubShortId] && clubsMap[cm.clubShortId].owner !== this.player.model._id) {
          // 不是战队主, 小联盟队员只需要看到联盟的情况
          for (let i = 0; i < clubs.length; i++) {
            if (clubs[i].shortId === cm.clubShortId) {
              clubs.splice(i, 1);
              break;
            }
          }
        }
      }
    })
    const unionClubs = await Club.find({ shortId: {
      $in: unionClubShortIdList,
      }})
    clubs.push(...unionClubs);
    // 获取房间信息
    const room = await this.getClubRoomInfo(playerClub._id, playerClub.shortId);
    const currentClubMemberShip = allClubMemberShips.find(x => x.club._id.toString() === clubId)
    const isAdmin = currentClubMemberShip && currentClubMemberShip.role === 'admin'
    const clubOwnerId = playerClub.owner;
    const clubOwner = await PlayerModel.findOne({_id: clubOwnerId}).sort({name: 1})
    const currentClubPlayerGold = currentClubMemberShip && currentClubMemberShip.clubGold || 0;
    const clubRule = await this.getClubRule(playerClub);
    const clubInfo = {
      gem: clubOwner.gem,
      name: clubOwner.name,
      clubGold: currentClubPlayerGold,
      clubName: playerClub.name,
      clubShortId: playerClub.shortId,
      lockedRule: clubRule.lockedRule,
      publicRule: clubRule.publicRule,
      goldRule: clubRule.goldRule,
    }
    // FIXME un-listen
    // await player.listenClub(playerClub._id)
    // 添加房间信息
    this.replySuccessWithInfo('', {roomInfo: room, clubInfo, clubs, isAdmin});
  }

  // 离开俱乐部
  @addApi()
  async leave(message: any) {
    const club = await Club.findOne({shortId: message.clubShortId})
    if (!club) {
      return this.replyFail(`没有战队【${message.clubShortId}】`);
    }
    if (club.owner === this.player.id) {
      return this.replyFail('战队主不能离开自己的战队！');
    }
    const clubMemberInfo = await ClubMember.findOne({club: club._id, member: this.player.id})
    if (!clubMemberInfo) {
      return this.replyFail('您没有加入该战队');
    }
    if (!isNaN(clubMemberInfo.clubGold) && clubMemberInfo.clubGold < 0) {
      return this.replyFail('金币为负数，无法退出战队，请联系战队主。');
    }
    await ClubMember.remove({member: this.player.id, club: club._id})
    this.replySuccess();
  }

  @addApi()
  async getRequestInfo(message: any) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('战队创建者才可查看');
    }
    if (myClub.shortId !== message.clubShortId) {
      return this.replyFail('该战队非自己的战队');
    }
    const clubRequestInfo = await ClubRequest.find({clubShortId: message.clubShortId});
    // 邀请信息列表
    const clubUnionRequestInfo = await service.club.getMyUnionRequest(message.clubShortId);
    this.replySuccessWithInfo('', {clubRequestInfo, clubUnionRequestInfo});
  }

  @addApi({apiName: 'updatePlayerInfo'})
  async getPlayerInfo() {
    const ownerClub = await Club.find({owner: this.player.id});
    // 所有 shortId
    const myClubId = [];
    if (ownerClub && ownerClub.length > 0) {
      // 存在俱乐部
      ownerClub.forEach(c => {
        myClubId.push(c.shortId);
      })
    }
    // 查找联盟 id
    const playerClub = await this.getPlayerClub(this.player.id);
    this.replySuccessWithInfo('', {
      clubShortId: playerClub && playerClub.shortId || 0,
      myClub: myClubId,
    });
  }

  // 战队战绩
  @addApi({apiName: 'recordList'})
  async getRecordList(message: any) {
    const club = await Club.findOne({shortId: message.clubShortId});
    const clubExtra = await this.getClubExtra(club._id)
    const renameList = clubExtra.renameList
    const players = await PlayerModel.find({ _id: { $in: Object.keys(renameList) }});
    // 通过 shortId 查找备注名
    const nameMap = {};
    for (const p of players) {
      if (renameList[p._id]) {
        nameMap[p.shortId] = renameList[p._id];
      }
    }
    // 查找未删除的记录
    const records = await RoomRecord
      .find({club: club._id, category: message.gameType, checked: false})
      .sort({createAt: -1})
      .limit(1000)
      .lean()
      .exec()
    const isClubOwnerOAdmin = await this.isOwnerOrAdmin(club._id, this.player.id);
    const formatted = [];
    for (const record of records) {
      let isMyRecord = false;
      const scores = record.scores.map(s => {
        if (s.shortId === this.player.model.shortId) {
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
          rule: record.rule,
          roomState: record.roomState,
          checked: record.checked,
          seen: record.seen,
        })
      }
    }
    return this.replySuccessWithInfo('', {records: formatted});
  }

  @addApi({apiName: 'recordRankList'})
  async getRecordRankList(message: any) {
    const club = await Club.findOne({shortId: message.clubShortId});
    const onlyShowMySelf = false;
    if (club) {
      // const myClub = await this.getOwnerClub(this.player.model._id, message.clubShortId);
      // if (myClub || await this.playerIsAdmin(this.player.model._id, message.clubShortId)) {
      //   onlyShowMySelf = false;
      // }
      // 取3天的记录
      const minDate = new Date();
      minDate.setHours(0);
      minDate.setMinutes(0);
      minDate.setSeconds(0);
      minDate.setMilliseconds(0);
      minDate.setDate(minDate.getDate() - 3);
      const records = await RoomRecord
        .find({club: club._id, category: message.gameType, createAt: {$gt: minDate }})
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
          for (let i = 0; i < 3; i++) {
            currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * i);
            detailData.push({
              time: currentDate.toLocaleDateString(),
              // 大赢家次数
              bigWinnerCount: 0,
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
            headImgUrl: clubMember.member.headImgUrl,
            name: clubMember.member.name,
            score: clubMember.member.score || 0,
            detailData,
          }
          if (onlyShowMySelf) {
            if (clubMember.member.shortId === this.player.model.shortId) {
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
          if (!d || onlyShowMySelf && d.shortId !== this.player.model.shortId) {
            return
          }
          let tempIndex = rankData.findIndex(x => x.shortId === d.shortId);
          detailData = [];
          for (let i = 0; i < 3; i++) {
            currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * i);
            detailData.push({
              time: currentDate.toLocaleDateString(),
              bigWinnerCount: 0,
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
            headImgUrl: d.headImgUrl,
            name: d.name,
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
              for (const shortId of r.bigWinner) {
                if (pData.shortId === shortId) {
                  x.bigWinnerCount++;
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

      return this.replySuccessWithInfo('', {rankData, summary: totalStatistic});
    }
    return this.replyFail('无法查看！');
  }

  @addApi({apiName: 'recordRoomPlayerInfo'})
  async getRecordRoomPlayerInfo(message: any) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
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
        const playerInfo = record.record
        const events = record.events.splice(0, 4)
        for (let i = 0; i < playerInfo.length; i++) {
          const playerCardsInfo = events.find(x => x.index === i)
          playerInfo[i].cards = []
          if (playerCardsInfo) {
            playerInfo[i].cards = playerCardsInfo.info.cards
          }
        }
        // 最后一局解散，出现多余战绩bug(例如共12局出现13.14局战绩)，用规则限制个数
        if (playerInfos.length >= allJuShu) {
          return
        }
        roomInfos.ju.push(record.juShu)
        playerInfos.push(playerInfo)
      })
      return this.replySuccessWithInfo('', {playerInfos, roomInfos, roomNum});
    }
    return this.replyFail('没有权限！');
  }

  @addApi()
  async changeClubRecordState(message: any) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('没有权限');
    }
    const record = await RoomRecord.findOne({ room: message.room });
    if (record) {
      record.checked = true;
      await record.save();
      return this.replySuccessWithInfo('移除成功');
    }
    return this.replyFail('请稍后重试');
  }

  @addApi()
  async seenClubRecords(message: any) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('没有权限');
    }
    try {
      await RoomRecord.update({room: message.room}, {
        seen: true,
      })
      return this.replySuccessWithInfo('设置成功');
    } catch (e) {
      this.logger.error(e)
      return this.replyFail('请稍后重试');
    }
  }

  // 开关战队创建房间功能
  @addApi()
  async changeState(message) {
    const myClub = await Club.findOne({owner: this.player.model._id});
    if (myClub) {
      myClub.state = message.state
      await myClub.save()
      const info = message.state === 'on' ? '已打开战队创建房间功能' : '已关闭战队创建房间功能'
      return this.replySuccessWithInfo(info, {state: message.state})
    } else {
      return this.replyFail('错误的请求');
    }
  }

  // 获取战队成员
  @addApi()
  async getClubMembers(message) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('非战队创建者不能查看');
    }
    const clubExtra = await this.getClubExtra(myClub._id)
    const clubMembers = await ClubMember.find({club: myClub._id})
    const clubMembersInfo = [];
    const clubExtraData = {
      blacklist: clubExtra && clubExtra.blacklist,
      renameList: clubExtra && clubExtra.renameList,
    }
    for (const clubMember of clubMembers) {
      const memberInfo = await PlayerModel.findOne({_id: clubMember.member})
      if (memberInfo) {
        clubMembersInfo.push({
          name: memberInfo.name,
          id: memberInfo._id,
          headImage: memberInfo.headImgUrl,
          gem: memberInfo.gem,
          clubGold: clubMember.clubGold,
          shortId: memberInfo.shortId,
          isAdmin: clubMember.role === 'admin',
        })
      }
    }
    return this.replySuccessWithInfo('', {clubMembersInfo, clubExtraData});
  }

  @addApi()
  async renameClubPlayer(message) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('权限不足，不能执行操作');
    }
    const clubExtra = await this.getClubExtra(myClub._id)
    const renameList = clubExtra.renameList
    renameList[message.playerId] = message.rename

    await ClubExtra.update({clubId: myClub._id}, {$set: {renameList}})
    return this.replySuccessWithInfo('操作成功');
  }

  // 俱乐部改名
  @addApi({apiName: 'rename'})
  async renameClub(message) {
    const myClub = await this.getOwnerClub(this.player.model._id, message.clubShortId);
    if (!myClub) {
      return this.replyFail('没有权限');
    }
    const playerInfo = await PlayerModel.findOne({_id: this.player.id})
    // 检查房卡
    // @ts-ignore
    const requiredGem = config.club.gemRename;
    if (playerInfo.gem < requiredGem) {
      return this.replyFail(`钻石不足请充值(需要钻石${requiredGem})`);
    }
    // @ts-ignore
    if (!message.newClubName || message.newClubName.length > config.club.maxNameLength) {
      return this.replyFail('非法名字');
    }
    // 保存新名字
    const oldName = myClub.name;
    myClub.name = message.newClubName;
    await myClub.save();
    const remainGem = playerInfo.gem - requiredGem;
    await PlayerModel.update({_id: this.player.id}, {$set: {gem: remainGem}}).exec();
    this.replySuccess({gem: remainGem});
    // 添加日志
    await service.club.logRename(myClub._id, oldName, myClub.name, playerInfo._id);
  }

  @addApi({apiName: 'transfer'})
  async transferClub(message) {
    const myClub = await this.getOwnerClub(this.player.model._id, message.clubShortId);
    if (!myClub) {
      return this.replyFail('没有权限');
    }
    const playerInfo = await PlayerModel.findOne({_id: this.player.id})
    // 检查房卡
    // @ts-ignore
    const outGem = config.club.transferOutGem;
    if (playerInfo.gem < outGem) {
      return this.replyFail(`钻石不足,转移操作需要${outGem}钻石,您当前钻石为${playerInfo.gem}个`);
    }
    // 转入的房卡
    // @ts-ignore
    const inGem = config.club.transferInGem;
    // 接收人
    const transferee = await PlayerModel.findOne({shortId: message.toShortId});
    if (!transferee) {
      return this.replyFail('用户不存在');
    }
    if (transferee.gem < inGem) {
      return this.replyFail('对方钻石不足,不能转入');
    }
    if (transferee.shortId === playerInfo.shortId) {
      return this.replyFail('不能转移同一人');
    }
    const hasClub = await Club.findOne({owner: transferee._id});
    if (hasClub) {
      return this.replyFail('对方已有战队，不能转移');
    }
    // 检查转移的战队有没有联盟
    const joinUnionClub = await service.club.getJoinUnionClub(myClub.shortId);
    const hasUnionClub = await service.club.getMyUnionClub(myClub.shortId);
    if (joinUnionClub || hasUnionClub.length > 0) {
      return this.replyFail('请先解散战队联盟');
    }
    // 保存
    myClub.owner = transferee._id;
    await myClub.save();
    await PlayerModel.update({_id: this.player.id}, {$set: {gem: playerInfo.gem - outGem}}).exec();
    await PlayerModel.update({_id: transferee._id}, {$set: {gem: transferee.gem - inGem}}).exec();
    // 添加被转移人为成员
    const member = await ClubMember.findOne({member: transferee._id, club: myClub._id});
    if (!member) {
      await service.club.addClubMember(myClub._id, transferee._id, myClub.shortId);
    }
    this.replySuccess({gem: playerInfo.gem - outGem});
    // 通知被转移人
    await notifyTransfer(playerInfo, transferee, myClub.name, myClub.shortId);
    // 添加日志
    await service.club.logTransfer(myClub._id, playerInfo._id, transferee._id);
  }

  @addApi()
  async operateBlackList(message) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('权限不足，不能执行操作');
    }
    if (myClub.owner === message.playerId) {
      return this.replyFail('不能操作战队主');
    }
    const clubExtra = await this.getClubExtra(myClub._id)
    let blacklist = clubExtra.blacklist
    if (message.operate === 'add') {
      blacklist.push(message.playerId)
    } else {
      blacklist = blacklist.filter(x => x !== message.playerId)
    }
    clubExtra.blacklist = blacklist
    await clubExtra.save()
    return this.replySuccessWithInfo('操作成功');
  }

  @addApi()
  async removePlayer(message) {
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (!myClub) {
      return this.replyFail('非战队创建者不能操作');
    }
    if (myClub.owner === message.playerId) {
      return this.replyFail('不能移除战队主');
    }
    await ClubMember.remove({member: message.playerId, club: myClub._id})
    this.replySuccessWithInfo('移除成功');
  }

  @addApi()
  async adminRemovePlayer(message) {
    const club = await Club.findOne({shortId: message.clubShortId})
    const playerToRm = await PlayerModel.findOne({shortId: message.shortId}).lean()
    const memberShip = await ClubMember.findOne({club: club._id, member: playerToRm._id}).lean()
    if (memberShip.role === 'admin') {
      return this.replyFail('管理员不能删除其他管理员');
    }
    if (playerToRm._id === club.owner) {
      return this.replyFail('管理员不能删除战队创建者');
    }
    if (playerToRm._id === this.player._id) {
      return this.replyFail('不能删除您自己');
    }
    await ClubMember.remove({member: message.playerId, club: club._id})
    this.replySuccessWithInfo('移除成功');
  }

  @addApi()
  async setLockRule(message) {
    if (!message.gameType) {
      return this.replyFail('错误的请求')
    }
    const myClub = await this.getMyClubOrClubInAdmin(message.clubShortId);
    if (myClub) {
      await service.club.createClubRule(myClub._id, message.gameType, 0, RuleType.locked, message.lockedRule)
      return this.replySuccess();
    } else {
      return this.replyFail('错误的请求')
    }
  }

  @addApi()
  async promoteAdmin(message) {
    if (this.player.model.shortId === message.playerShortId) {
      return this.replyFail('不能修改圈主权限');
    }
    const club = await Club.findOne({owner: this.player.model._id});
    if (club) {
      const member = await PlayerModel.findOne({shortId: message.playerShortId})
      const memberShip = await ClubMember.findOne({club: club._id, member: member._id})
      if (memberShip) {
        memberShip.role = 'admin'
        await memberShip.save()
        return this.replySuccessWithInfo('设置成功')
      } else {
        return this.replyFail('错误的请求')
      }
    } else {
      return this.replyFail('错误的请求')
    }
  }

  // 更新金币
  @addApi()
  async updatePlayerClubGold(message) {
    if (!message.clubGold || message.clubGold < 0) {
      return this.replyFail('参数错误')
    }
    const isAdmin = await this.isOwnerOrAdmin(message.clubShortId, this.player.id);
    if (!isAdmin) {
      return this.replyFail('非战队主，没有对应权限')
    }
    const club = await Club.findOne({shortId: message.clubShortId});
    if (club) {
      // 检查该战队是不是加入了大联盟
      const unionClub = await service.club.getJoinUnionClub(club.shortId);
      let resp;
      if (unionClub) {
        resp = await this.updateUnionClubGold(club, unionClub.mainClubId, message.playerShortId, message.clubGold);
      } else {
        resp = await this.updateClubGold(club._id, message.playerShortId, message.clubGold);
        // if (resp.isOk) {
        //   // 更新小联盟的金币
        //   await this.updateJoinClubOwnerGold(club.shortId, message.playerShortId, resp.clubGold);
        // }
      }
      if (resp.isOk) {
        return this.replySuccessWithInfo('设置成功')
      }
      console.error('invalid update club gold', resp.info);
      return this.replyFail(resp.info || '错误的请求')
      // const member = await PlayerModel.findOne({shortId: message.playerShortId})
      // const memberShip = await ClubMember.findOne({club: club._id, member: member._id})
      // if (memberShip) {
      //   memberShip.clubGold += message.clubGold;
      //   await ClubGoldRecord.create({
      //     club: club._id,
      //     member: member._id,
      //     from: this.player._id,
      //     goldChange: message.clubGold,
      //     allClubGold: memberShip.clubGold,
      //     info: "圈主增加",
      //   })
      //   await memberShip.save()
      //   return this.replySuccessWithInfo('设置成功')
      // } else {
      //   return this.replyFail('错误的请求')
      // }
    } else {
      return this.replyFail('错误的请求')
    }
  }

  @addApi()
  async cleanCoin(message) {
    const club = await Club.findOne({shortId: message.clubShortId});
    if (!club) {
      return this.replyFail('战队不存在');
    }
    const isAdmin = await this.isOwnerOrAdmin(club._id, this.player.id);
    if (!isAdmin) {
      return this.replyFail('非战队主，没有对应权限')
    }
    const member = await PlayerModel.findOne({shortId: message.playerShortId})
    const gn = await service.roomRegister.isPlayerInRoom(member._id);
    if (gn) {
      return this.replyFail('该玩家在游戏房间内，请退出房间后重试！');
    }
    const memberShip = await ClubMember.findOne({club: club._id, member: member._id})
    if (memberShip) {
      const clubGold = memberShip.clubGold;
      memberShip.clubGold = 0;
      await ClubGoldRecord.create({
        club: club._id,
        member: member._id,
        from: this.player._id,
        goldChange: -clubGold,
        allClubGold: 0,
        info: "圈主清零",
      })
      await memberShip.save();
      return this.replySuccess();
    } else {
      return this.replyFail('非战队成员');
    }
  }

  @addApi()
  async getClubGoldRecords() {
    this.replyFail('暂未开放')
  }

  @addApi()
  async unPromoteAdmin(message) {
    const club = await Club.findOne({owner: this.player.model._id});

    if (club) {
      const member = await PlayerModel.findOne({shortId: message.playerShortId})
      const memberShip = await ClubMember.findOne({club: club._id, member: member._id})
      if (memberShip) {
        memberShip.role = ''
        await memberShip.save()
        return this.replySuccessWithInfo('设置成功');
      } else {
        return this.replyFail('错误的请求')
      }
    } else {
      return this.replyFail('错误的请求')
    }
  }

  @addApi({apiName: 'rebate'})
  async rebateClub(message) {
    if (!message.gameType) {
      return this.replyFail('错误的请求');
    }
    const myClub = await Club.findOne({shortId: message.clubShortId, owner: this.player.model._id});
    if (myClub) {
      const clubId = myClub._id
      const day = moment().subtract(0, 'day').startOf('day').toDate()
      const from = moment(day).startOf('day').toDate()
      const end = moment(day).endOf('day').toDate()
      const data = {
        roomInfo: [],
        getGem: 0,
      }
      const clubRoomRecord = await ClubRoomRecordModel.findOne({
        club: clubId,
        createAt: {$gt: from, $lte: end}
      })
      if (clubRoomRecord) {
        const roomInfo = clubRoomRecord.roomInfo
        if (roomInfo) {
          let baJuTimes = 0
          let shierJuJuTimes = 0
          let shibaJuJuTimes = 0
          if (roomInfo[8]) {
            baJuTimes = roomInfo[8].times || 0
          }
          if (roomInfo[12]) {
            shierJuJuTimes = roomInfo[12].times || 0
          }
          if (roomInfo[18]) {
            shibaJuJuTimes = roomInfo[18].times || 0
          }
          data.roomInfo = roomInfo
          if (message.gameType === 'zhadan' || message.gameType === 'biaofen') {
            if (shierJuJuTimes >= 100) {
              data.getGem = baJuTimes + shierJuJuTimes * 2 || 0
            } else if (baJuTimes + shierJuJuTimes >= 30) {
              data.getGem = baJuTimes + shierJuJuTimes || 0
            }
          }
          if (message.gameType === 'paodekuai') {
            if (shibaJuJuTimes >= 100) {
              data.getGem = shierJuJuTimes + shibaJuJuTimes * 2 || 0
            } else if (shierJuJuTimes + shibaJuJuTimes >= 30) {
              data.getGem = shierJuJuTimes + shibaJuJuTimes || 0
            }
          }
          if (message.gameType === 'majiang') {
            if (shierJuJuTimes >= 30) {
              data.getGem = shierJuJuTimes || 0
            }
          }
          return this.replyFailWithInfo('请联系客服，微信号:pcsssmj', data);
        }
      } else {
        return this.replyFail('您的战队昨日没有符合要求的房间。');
      }
      return this.replySuccess(data)
    } else {
      return this.replyFail('错误的请求')
    }
  }

  @addApi()
  async addRule(message) {
    const clubShortId = message.clubShortId;
    const gameType = message.gameType;
    // 公共房还是金币房
    const ruleType = message.ruleType;
    const rule = message.rule;
    const playerCount = rule.playerCount;
    const club = await Club.findOne({shortId: clubShortId});
    if (!club) {
      return this.replyFail('俱乐部不存在');
    }
    const isOk = await this.isOwnerOrAdmin(club._id, this.player.id);
    if (!isOk) {
      return this.replyFail('没有权限');
    }
    // 根据玩家数查找规则
    let find;
    if (gameType === GameType.zd) {
      // 炸弹根据大小王数判断
      find = await ClubRuleModel.findOne({clubId: club._id, gameType, ruleType, jokerCount: rule.jokerCount});
    } else {
      find = await ClubRuleModel.findOne({clubId: club._id, gameType, ruleType, playerCount});
    }
    if (find) {
      // 当前玩家人数的规则已经有了
      return this.replyFail('当前规则已存在');
    }
    const {model} = await service.club.createClubRule(club._id, gameType, playerCount, ruleType, rule);
    // @ts-ignore
    this.replySuccess({...model.rule, ruleId: model._id.toString()})
  }

  @addApi()
  async editRule(message) {
    const result = await ClubRuleModel.findById(message.ruleId);
    if (!result) {
      return this.replyFail('没有此规则');
    }
    const isOk = await this.isOwnerOrAdmin(result.clubId, this.player.id);
    if (!isOk) {
      return this.replyFail('没有权限');
    }
    const rule = message.rule;
    if (result.gameType === GameType.zd) {
      // 炸弹的大小王数不可更改
      rule.jokerCount = result.jokerCount;
    } else {
      // 人数不可更改
      rule.playerCount = result.playerCount;
    }
    delete rule.ruleId;
    result.rule = rule;
    await result.save();
    this.replySuccess();
  }

  @addApi()
  async deleteRule(message) {
    const result = await ClubRuleModel.findById(message.ruleId);
    if (!result) {
      return this.replyFail('没有此规则');
    }
    const isOk = await this.isOwnerOrAdmin(result.clubId, this.player.id);
    if (!isOk) {
      return this.replyFail('没有权限');
    }
    await result.remove();
    this.replySuccess();
  }

  // 获取 club 游戏列表
  @addApi({
    rule: {
      clubShortId: 'number',
    }
  })
  async getGameList(message) {
    const myClub = await this.mustGetClub(message.clubShortId);
    await this.mustClubMemberOrUnionMember(myClub, this.player.id);
    // 是否能解锁(只有创建者能解锁游戏)
    const isCanUnlock = myClub.owner === this.player.id;
    const gameList = [];
    const unlockGame = myClub.gameList || {};
    const gameLength = Object.values(unlockGame).length;
    let fee;
    for (const gameType of GameTypeList) {
      const isUnlock = !!unlockGame[gameType];
      if (gameLength === 0 || isUnlock) {
        // 解锁第一款全免费，或者已经解锁
        fee = 0;
      } else {
        fee = config.club.unlockGameGem;
      }
      gameList.push({
        // 游戏类型
        gameType,
        // 游戏是否解锁
        isUnlock,
        // 解锁需要的房卡
        unlockFee: fee,
        // 本人是否能解锁
        isCanUnlock,
      })
    }
    return this.replySuccess(gameList);
  }

  // 解锁游戏
  @addApi({
    rule: {
      gameType: 'string',
      // 俱乐部 id
      clubShortId: 'number',
    }
  })
  async unlockGame(message) {
    const index = GameTypeList.indexOf(message.gameType);
    if (index === -1) {
      throw new GameError(Errors.gameTypeNotExists)
    }
    const myClub = await this.mustGetOwnerClub(message.clubShortId);
    if (myClub.gameList && myClub.gameList[message.gameType]) {
      // 已经解锁
      throw new GameError('游戏已解锁');
    }
    // 加锁
    const lock = await this.service.utils.grantLockOnce(RedisKey.unlockClubGameLock + message.clubShortId, 3);
    if (!lock) {
      return this.replyFail('解锁失败')
    }
    const playerInfo = await PlayerModel.findById(this.player.id)
    if (!myClub.gameList || Object.values(myClub.gameList).length === 0) {
      // 解锁第一个游戏，不需要扣房卡
      myClub.gameList = {};
    } else {
      // 检查房卡
      const outGem = config.club.unlockGameGem;
      if (playerInfo.gem < outGem) {
        await lock.unlock();
        return this.replyFail(`钻石不足,解锁需要${outGem}钻石,您当前钻石为${playerInfo.gem}个`);
      }
      playerInfo.gem -= outGem;
      // 新记录
      await this.service.playerService.logGemConsume(playerInfo._id, ConsumeLogType.unlockGame, -outGem,
        playerInfo.gem, message.gameType)
      // 旧记录
      await this.service.playerService.logOldGemConsume(playerInfo._id, `解锁游戏${message.gameType}`, outGem);
      await playerInfo.save();
    }
    myClub.gameList[message.gameType] = true;
    // 告知 mongoose 保存
    myClub.markModified('gameList');
    await myClub.save();
    await lock.unlock();
    this.replySuccess({ gem: playerInfo.gem });
  }

  // 设置亲密度
  @addApi({
    rule: {
      playerId: 'string',
      // // 俱乐部 id
      // clubShortId: 'number',
      // 度数
      degree: 'number',
    }
  })
  async setMemberDegree(message) {
    const playerOwnerClub = await this.service.club.getOwnerClub(message.playerId);
    const ownerClub = await this.service.club.getOwnerClub(this.player.model._id);
    if (!ownerClub) {
      return this.replyFail('无权限');
    }
    const union = await this.service.club.getJoinUnionClub(playerOwnerClub.shortId);
    if (!union || union.mainClubShortId !== ownerClub.shortId) {
      return this.replyFail('未联盟');
    }
    const member = await this.service.club.setClubMemberDegree(ownerClub._id, message.playerId, message.degree);
    if (!member) {
      return this.replyFail('成员不存在')
    }
    return this.replySuccess();
  }

  // 邀请联盟
  @addApi({
    rule: {
      // 邀请的战队 id
      inviteClubShortId: 'number',
    }
  })
  async inviteUnionClub(msg) {
    const club = await service.club.getOwnerClub(this.player.model._id);
    if (!club) {
      return this.replyFail('非战队主不能邀请')
    }
    // 检查昨日对局 > 30
    const yesterdayCount = await service.club.countYesterdayGameByClub(club._id);
    if (yesterdayCount < config.club.minYesterdayGameCounter) {
      return this.replyFail(`昨日对局数必须不少于${config.club.minYesterdayGameCounter}`);
    }
    const inviteClub = await service.club.getClubByShortId(msg.inviteClubShortId);
    if (!inviteClub) {
      return this.replyFail('受邀战队不存在');
    }
    await service.club.getOrAddUnionRequest(
      this.player.model._id, this.player.model.shortId, club.shortId, inviteClub.shortId,
    );
    // 通知受邀人
    await this.broadcastAdminAndOwner(inviteClub, 'club/receiveInviteRequest', {});
    return this.replySuccess('邀请发送成功')
  }

  // 处理绑定联盟
  @addApi({
    rule: {
      requestId: 'string',
      // 是否接受邀请
      isAccept: 'bool',
      // 验证码
      smsCode: {
        type: 'string',
        required: false,
      },
    }
  })
  async dealUnionClub(msg) {
    const request = await ClubUnionRequest.findById(msg.requestId);
    if (!request || request.isClose) {
      return this.replyFail('邀请已处理');
    }
    const club = await service.club.getOwnerClub(this.player.model._id);
    if (!club || club.shortId !== request.inviteClubShortId) {
      return this.replyFail('无此邀请');
    }
    if (msg.isAccept) {
      // 同意加入，检查验证码
      if (!config.game.debug) {
        const smsCode = await createClient().getAsync(this.player.model.phone);
        if (!smsCode) {
          return this.replyFail('验证码超时或验证码错误');
        }
        if (smsCode !== msg.smsCode) {
          return this.replyFail('验证码错误');
        }
      }
      // 检查是否能接受邀请
      const result = await service.club.isCanUnionClub(this.player.model._id, request.mainClubShortId);
      if (!result.isOk) {
        // 不能接受邀请
        return this.replyFail(result.info);
      }
      const mainClub = await service.club.getClubByShortId(request.mainClubShortId);
      await service.club.bindUnionClub(this.player.model._id,
        mainClub._id, mainClub.shortId, club);
      const inviter = await service.playerService.getPlayerModel(mainClub.owner);
      await service.club.mailAcceptUnionClubInvite(inviter, this.player.model);
    }
    // 删除处理过的请求
    await request.remove();
    // request.isClose = true;
    // request.isAccept = msg.isAccept;
    // await request.save();
    return this.replySuccess('处理成功');
  }

  // 解除被邀请战队的联盟
  @addApi({
    rule: {
      // 验证码
      smsCode: 'string',
      // 解除的玩家 id
      unionPlayerId: 'string',
    }
  })
  async unbindUnionClub(msg) {
    const mainClub = await service.club.getOwnerClub(this.player.model._id);
    if (!mainClub) {
      return this.replyFail('无权限');
    }
    // 查找玩家有没有加入本战队
    const member = await service.club.getClubMemberByShortId(msg.unionPlayerId, mainClub.shortId);
    if (!member) {
      return this.replyFail('玩家未加入战队');
    }
    const smsCode = await createClient().getAsync(this.player.model.phone);
    if (!smsCode) {
      return this.replyFail('验证码超时或验证码错误');
    }
    if (smsCode !== msg.smsCode) {
      return this.replyFail('验证码错误');
    }
    const unionClub = await service.club.getOwnerClub(msg.unionPlayerId);
    if (!unionClub) {
      return this.replyFail('战队不存在');
    }
    const clubUnion = await service.club.getJoinUnionClub(unionClub.shortId);
    if (!clubUnion || clubUnion.mainClubShortId !== mainClub.shortId) {
      return this.replyFail('战队未加入');
    }
    await service.club.unbindUnionClub(
      unionClub.owner, mainClub._id, mainClub.shortId, unionClub._id, unionClub.shortId
    );
    const unionOwner = await service.playerService.getPlayerModel(unionClub.owner);
    await service.club.mailUnbindUnionClub(unionOwner);
    return this.replySuccess('解散成功');
  }

  // 获取亲密战友列表
  @addApi()
  async getUnionMemberList() {
    const club = await service.club.getOwnerClub(this.player.model._id);
    if (!club) {
      return this.replyFail('权限不足');
    }
    // 自己的联盟战队
    const list = await service.club.getMyUnionClub(club.shortId);
    const idList = service.utils.filterModel(list, 'fromClubId');
    const clubs = await Club.find({
      _id: {
        $in: idList,
      }
    });
    const ownerList = service.utils.filterModel(clubs, 'owner');
    // 查找 clubMember 中的亲密 member
    const members = await ClubMember.find({
      member: {
        $in: ownerList,
      },
      club: club._id,
    }).populate('member').lean();
    const records = [];
    const clubMaps = service.utils.array2map(clubs, 'owner');
    members.forEach(row => {
      records.push({
        role: row.role,
        // 亲密度
        degree: row.degree,
        // 联盟的战队 id
        unionClubShortId: clubMaps[row.member._id] && clubMaps[row.member._id].shortId,
        // 联盟战队名字
        unionClubName: clubMaps[row.member._id] && clubMaps[row.member._id].name || '',
        // 玩家名字
        memberName: row.member.name,
        // 玩家 shortId
        memberShortId: row.member.shortId,
        // 玩家 id
        memberPlayerId: row.member._id,
        // 头像
        memberHeadImgUrl: row.member.headImgUrl,
        // 金币
        clubGold: row.clubGold,
      })
    })
    return this.replySuccess({ members: records })
  }

  // 获取战队请求信息
  @addApi({
    rule: {
      clubShortId: 'number',
    }
  })
  async getClubRequest() {
    const ownerClub = await Club.findOne({
      owner: this.player.model._id,
    })
    // 是否有联盟邀请
    let isInviteRequest = false;
    // 是否有加入请求
    let isJoinRequest = false;
    // 是否加入联盟
    let isUnionClub = false;
    if (ownerClub) {
      // 是战队主
      isInviteRequest = await ClubUnionRequest.count({
        inviteClubShortId: ownerClub.shortId,
        isClose: false,
      }) > 0;
      isJoinRequest = await ClubRequest.count({
        clubShortId: ownerClub.shortId,
      }) > 0;
      isUnionClub = !!await service.club.getJoinUnionClub(ownerClub.shortId);
    }
    return this.replySuccess({ isInviteRequest, isJoinRequest, isUnionClub });
  }

  // 获取 club 规则
  async getClubRule(club) {
    const publicRule = [];
    const goldRule = [];
    const lockedRule = {};
    // 获取联盟战队的规则
    const unionClub = await service.club.getJoinUnionClub(club.shortId);
    let checkClubId = club._id;
    if (unionClub) {
      checkClubId = unionClub.mainClubId;
    }
    const result = await ClubRuleModel.find({clubId: checkClubId});
    if (result.length > 0) {
      for (const r of result) {
        if (r.ruleType === RuleType.public) {
          publicRule.push({...r.rule, ruleId: r._id.toString()});
        } else if (r.ruleType === RuleType.gold) {
          goldRule.push({...r.rule, ruleId: r._id.toString()});
        } else if (r.ruleType === RuleType.locked) {
          lockedRule[r.gameType] = {...r.rule, ruleId: r._id.toString()};
        }
      }
    }
    return {publicRule, goldRule, lockedRule};
  }

  async getOwnerClub(playerId, clubShortId) {
    const ownerClub = await Club.findOne({owner: playerId, shortId: clubShortId});
    if (ownerClub) {
      return ownerClub;
    }
    return false
  }

  async mustGetOwnerClub(clubShortId) {
    const ownerClub = await Club.findOne({owner: this.player.id, shortId: clubShortId});
    if (!ownerClub) {
      throw new GameError(Errors.clubNotExists);
    }
    return ownerClub;
  }

  // 获取俱乐部
  async mustGetClub(clubShortId) {
    const club = await Club.findOne({ shortId: clubShortId });
    if (!club) {
      throw new GameError(Errors.clubNotExists);
    }
    return club;
  }

  // 是否是战队成员
  async mustClubMemberOrUnionMember(club, playerId) {
    let info = await ClubMember.findOne({member: playerId, club: club._id});
    if (!info) {
      // 检查联盟
      info = await ClubMember.findOne({
        member: playerId,
        unionClubShortId: club.shortId,
      })
      if (!info) {
        throw new GameError(Errors.clubNotExists);
      }
    }
    return info;
  }

  async playerIsAdmin(playerId, clubShortId) {
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

  async getClubExtra(clubId) {
    let clubExtra = await ClubExtra.findOne({clubId});
    if (!clubExtra) {
      clubExtra = await ClubExtra.create({
        clubId,
      })
    }
    return clubExtra
  }

  async getPlayerClub(playerId, clubId?: string) {
    let clubMemberInfo;
    if (clubId) {
      clubMemberInfo = await ClubMember.findOne({member: playerId, club: clubId})
    } else {
      clubMemberInfo = await ClubMember.findOne({member: playerId})
    }
    if (!clubMemberInfo) {
      return null;
    }
    return Club.findOne({_id: clubMemberInfo.club}).lean();
  }

  // 是否有权限更改规则
  async isOwnerOrAdmin(clubIdOrShortId, playerId) {
    // 检查是否创建者、管理员
    let myClub;
    if (typeof clubIdOrShortId === 'number') {
      myClub = await Club.findOne({ shortId: clubIdOrShortId});
    } else {
      // 用 id
      myClub = await Club.findById(clubIdOrShortId);
    }
    if (!myClub) {
      // 俱乐部不存在
      return false;
    }
    if (myClub.owner === playerId) {
      // 创建者
      return true;
    }
    const member = await ClubMember.findOne({club: myClub._id, member: playerId});
    // 是成员且为管理员
    return member && member.role === 'admin';
  }

  // 根据 clubId 获取本人创建的战队,或者是管理员的战队
  async getMyClubOrClubInAdmin(clubShortId) {
    let myClub = await this.getOwnerClub(this.player.id, clubShortId);
    if (!myClub && await this.playerIsAdmin(this.player.id, clubShortId)) {
      myClub = await Club.findOne({shortId: clubShortId});
    }
    return myClub;
  }

  // 获取房间信息
  async getClubRoomInfo(clubId, clubShortId) {
    const unionClub = await service.club.getJoinUnionClub(clubShortId);
    let checkClubId = clubId;
    if (unionClub) {
      // 有加入的联盟，只显示联盟房间
      checkClubId = unionClub.mainClubId;
    }
    const allRoom = await RoomInfoModel.find({clubId: checkClubId.toString()});
    const clubRooms = [];
    for (const info of allRoom) {
      const roomDetail = await service.club.getRoomDetailByRoomId(info.roomId);
      if (!roomDetail) {
        continue;
      }
      const isOk = await service.roomRegister.isRoomExists(info.roomId);
      if (!isOk) {
        // 房间不存在，删除
        await info.remove();
        continue;
      }
      const detail = JSON.parse(roomDetail.detail);
      const rule = detail.gameRule || 'err';
      const roomNum = detail._id || 'err';
      const roomCreator = detail.creatorName || 'err';
      // 过滤机器人, null 玩家
      const playerOnline = detail.playersOrder.filter(value => value).length;
      const juIndex = detail.game.juIndex
      clubRooms.push({roomNum, roomCreator, rule, playerOnline, juIndex});
    }
    return clubRooms.sort((x, y) => {
      if (Math.max(x.playerOnline, y.playerOnline) < 4) {
        return y.playerOnline - x.playerOnline
      } else {
        return x.playerOnline - y.playerOnline
      }
    })
  }

  // 广播战队成员
  async broadcastMember(club, name, message) {
    const members = await ClubMember.find({clubId: club._id});
    for (const m of members) {
      const user = PlayerManager.getInstance().getPlayer(m.member);
      if (user) {
        user.sendMessage(name, message);
      }
    }
  }

  // 广播管理员、群主
  async broadcastAdminAndOwner(club, name, message) {
    const members = await ClubMember.find({clubId: club._id});
    for (const m of members) {
      const player = PlayerManager.getInstance().getPlayer(m.member);
      if (player && player.role === 'admin') {
        player.sendMessage(name, message);
      }
    }
    // 发送群主
    const user = PlayerManager.getInstance().getPlayer(club.owner);
    if (user) {
      user.sendMessage(name, message);
    }
  }

  // 更新联盟成员的金币
  async updateUnionClubGold(club, mainClubId, playerShortId, addCoin) {
    const member = await ClubMember.findOne({ club: mainClubId, member: club.owner });
    if (!member) {
      return { isOk: false, info: '战队联盟不存在' }
    }
    const allMember = await ClubMember.find({ club: club._id });
    let totalCoin = 0;
    allMember.map(elem => {
      if (elem.clubGold) {
        totalCoin += elem.clubGold;
      }
    })
    if (member.clubGold < totalCoin + addCoin) {
      return { isOk: false, info: '剩余金币不足'}
    }
    return this.updateClubGold(club._id, playerShortId, addCoin);
  }

  async updateClubGold(clubId, playerShortId, addCoin) {
    const member = await service.playerService.getPlayerModelByShortId(playerShortId);
    const memberShip = await ClubMember.findOne({club: clubId, member: member._id})
    if (memberShip) {
      memberShip.clubGold += addCoin;
      await ClubGoldRecord.create({
        club: clubId,
        member: member._id,
        from: this.player._id,
        goldChange: addCoin,
        allClubGold: memberShip.clubGold,
        info: "圈主增加",
      })
      await memberShip.save();
      return { isOk: true, clubGold: memberShip.clubGold };
    }
    return { isOk: false }
  }

  // // 更新联盟小战队主的金币
  // async updateJoinClubOwnerGold(mainClubShortId, playerShortId, clubGold) {
  //   const ownerClub = await service.club.getOwnerClubByShortId(playerShortId);
  //   if (!ownerClub) {
  //     // 没自建的战队
  //     return;
  //   }
  //   const clubUnion = await service.club.getJoinUnionClub(ownerClub.shortId);
  //   if (!clubUnion || clubUnion.mainClubShortId !== mainClubShortId) {
  //     return;
  //   }
  //   const member = await service.club.getClubMember(ownerClub._id, ownerClub.owner);
  //   if (!member) {
  //     console.error('club member', ownerClub.shortId, 'playerId', playerShortId, 'not exist');
  //     return;
  //   }
  //   member.clubGold = clubGold;
  //   await member.save();
  // }
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
