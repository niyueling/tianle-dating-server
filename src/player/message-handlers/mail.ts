import {ConsumeLogType} from "@fm/common/constants";
import {pick} from 'lodash'
import club from "../../database/models/club";
import Club from "../../database/models/club";
import ClubGoldRecord from "../../database/models/clubGoldRecord";
import clubMember from "../../database/models/clubMember";
import ConsumeRecord from "../../database/models/consumeRecord"
import DiamondRecord from "../../database/models/diamondRecord";
import {
  GiftState, Mail,
  MailModel,
  MailState,
  MailType,
  PublicMailModel,
  PublicMailRecordModel
} from "../../database/models/mail"
import PlayerModel from "../../database/models/player"
import {service} from "../../service/importService";
import {createLock} from '../../utils/lock'

const userLock = createLock()

const handler = {
  "mail/list": async function (player) {
    const club = await Club.findOne({owner: player._id})
    let publicMails = null
    if (club) {
      publicMails = await PublicMailModel.find().sort({createAt: -1}).lean().exec()
    } else {
      publicMails = await PublicMailModel.find({clubOwnerOnly: {$ne: true}}).sort({createAt: -1}).lean().exec()
    }

    const privateMails = await MailModel
      .find({to: player._id})
      .sort({createAt: -1}).lean().exec()

    // const publicMails = await PublicMailModel.find().sort({createAt: -1}).lean().exec()

    const publicMailRecords = await PublicMailRecordModel.find({
      player: player._id
    }).lean().exec()

    publicMails.forEach(mail => {
      const rec = publicMailRecords.find(r => r.mail === mail._id.toString())
      if (!rec) {
        mail.state = MailState.UNREAD
        mail.giftState = GiftState.AVAILABLE
      } else {
        mail.state = rec.state
        mail.giftState = rec.giftState || GiftState.AVAILABLE
      }
    })

    const mails = publicMails
      .filter(m => m.state !== MailState.DELETE)
      .concat(privateMails)

    mails.sort(function (a, b) {
      return b.createAt.getTime() - a.createAt.getTime()
    })

    player.sendMessage('mail/listReply', {mails})
  },

  'mail/read': async function (player, {_id}) {

    try {
      await MailModel.update({to: player._id, _id}, {
        $set: {state: MailState.READ}
      }).exec()

      player.sendMessage('mail/readReply', {ok: true})
    } catch (e) {
      player.sendMessage('mail/readReply', {ok: false})
    }
  },

  'mail/readNotice': async function (player, {_id}) {

    try {

      await PublicMailRecordModel.findOneAndUpdate(
        {player: player._id, mail: _id},
        {$set: {state: MailState.READ}}, {upsert: true, setDefaultsOnInsert: true}).exec()

      player.sendMessage('mail/readNoticeReply', {ok: true})
    } catch (e) {
      player.sendMessage('mail/readNoticeReply', {ok: false})
    }
  },

  'mail/readAll': async function (player) {
    await MailModel.update({to: player._id}, {
      $set: {state: MailState.READ}
    }, {multi: true}).exec()

    player.sendMessage('mail/readAllReply', {ok: true})
  },

  'mail/delete': async function (player, {_id}) {

    await MailModel.remove({to: player._id, _id}).exec()

    player.sendMessage('mail/deleteReply', {ok: true})
  },

  'mail/deleteNotice': async function (player, {_id}) {

    try {

      await PublicMailRecordModel.findOneAndUpdate(
        {player: player._id, mail: _id},
        {$set: {state: MailState.DELETE}}, {upsert: true}).exec()

      player.sendMessage('mail/deleteNoticeReply', {ok: true})
    } catch (e) {
      player.sendMessage('mail/deleteNoticeReply', {ok: false})
    }

  },

  'mail/requestGift': async function (player, {_id}) {

    const originalGiftMail = await MailModel.findOneAndUpdate({to: player._id, _id, type: MailType.GIFT}, {
      $set: {giftState: GiftState.REQUESTED}
    })

    if (!originalGiftMail) {
      player.sendMessage('mail/requestGiftReply', {ok: false, info: '没有该礼物'})
    }
    if (originalGiftMail.giftState === GiftState.AVAILABLE) {
      let updatedModel;
      const gift = originalGiftMail.gift.gift;
      if (gift && gift.prizeRecordId) {
        // 这个是抽奖中奖邮件
        const res = await service.lottery.receivePrize(gift.prizeRecordId);
        if (res.isOk) {
          updatedModel = res.model;
        } else {
          return player.sendMessage('mail/requestGiftReply', {ok: false, info: '领取失败'})
        }
      } else {
        // 增加钻石和金豆
        updatedModel = await PlayerModel.findByIdAndUpdate({_id: player._id},
          {$inc: originalGiftMail.gift},
          {new: true, select: {gem: 1, gold: 1, ruby: 1}, rawResult: true}).lean().exec()
      }

      if (updatedModel) {
        // 更新玩家的金币，房卡
        await player.updateResource2Client()
        player.sendMessage('mail/requestGiftReply', {ok: true})
        if (originalGiftMail.gift.gem > 0) {
          ConsumeRecord.create({
            ...originalGiftMail.gift, player: player._id, createAt: new Date(),
            note: `礼物 ${JSON.stringify(originalGiftMail.gift)} => ${updatedModel.gem}/${updatedModel.ruby}/${updatedModel.gold}`
          })
          service.playerService.logGemConsume(player.model._id,
            originalGiftMail.gift.source ? ConsumeLogType.chargeByMail : ConsumeLogType.chargeByActive,
            originalGiftMail.gift.gem, player.model.gem + originalGiftMail.gift.gem,
            `邮件赠送获得钻石${originalGiftMail.gift.gem}个`);
        }
      }
    } else {
      player.sendMessage('mail/requestGiftReply', {ok: false, info: '已经领取'})
    }
  },
  'mail/requestNoticeGift': async function (player, {_id}) {
    const giftMail = await PublicMailModel.findOne({_id, type: MailType.NOTICEGIFT})

    if (giftMail) {
      const unlock = await userLock(`gr${player._id}`, 3000)
      try {
        const record = await PublicMailRecordModel.findOneAndUpdate({mail: _id, player: player._id},
          {$set: {giftState: GiftState.REQUESTED}},
          {upsert: true, setDefaultsOnInsert: true}
        )

        if (record && record.giftState === GiftState.REQUESTED) {
          throw Error('已经领取')
        }
        const updatedModel = await PlayerModel.findByIdAndUpdate({_id: player._id},
          {$inc: giftMail.gift},
          {new: true, select: {gem: 1, ruby: 1, gold: 1}, rawResult: true}).lean().exec()

        await player.updateResource2Client()
        player.sendMessage('mail/requestGiftReply', {ok: true})
        if (giftMail.gift.gem > 0) {
          ConsumeRecord.create({
            ...giftMail.gift, player: player._id, createAt: new Date(),
            note: `公共礼物 ${JSON.stringify(giftMail.gift)} => ${updatedModel.gem}/${updatedModel.ruby}/${updatedModel.gold}`
          })
          new DiamondRecord({
            player: player.model._id,
            amount: giftMail.gift.gem,
            residue: player.model.gem + giftMail.gift.gem,
            type: giftMail.gift.source ? ConsumeLogType.chargeByPublicMail : ConsumeLogType.chargeByActive,
            note: `公共邮件赠送获得钻石${giftMail.gift.gem}个`,
          }).save()
        }
      } catch (e) {

        player.sendMessage('mail/requestGiftReply', {ok: false, info: e.message})
      } finally {
        await unlock()
      }
    } else {
      player.sendMessage('mail/requestGiftReply', {ok: false, info: '没有该礼物'})
    }
  }

}

export default handler

