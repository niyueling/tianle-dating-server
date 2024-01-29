import {ConsumeLogType, TianleErrorCode} from "@fm/common/constants";
import DiamondRecord from "../../database/models/diamondRecord";
import {
  GiftState,
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
  "mail/list": async function (player, {type}) {
    let publicMails = await PublicMailModel.find().sort({createAt: -1}).lean().exec();

    const privateMails = await MailModel.find({to: player._id}).sort({createAt: -1}).lean().exec()

    const mails = publicMails
      .filter(m => m.state !== MailState.DELETE)
      .concat(privateMails)

    mails.sort(function (a, b) {
      return b.createAt.getTime() - a.createAt.getTime()
    })

    player.sendMessage('mail/listReply', {ok: true, data: mails})
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

      await PublicMailModel.update({_id}, {
        $set: {state: MailState.READ}
      }).exec()

      player.sendMessage('mail/readNoticeReply', {ok: true})
    } catch (e) {
      player.sendMessage('mail/readNoticeReply', {ok: false})
    }
  },

  'mail/readAll': async function (player) {
    // 普通邮件全部已读
    await MailModel.update({to: player._id}, {
      $set: {state: MailState.READ}
    }, {multi: true}).exec()

    //获取系统邮件
    await PublicMailModel.update({type: MailType.NOTICE, state: {$ne: MailState.UNREAD}}, {
      $set: {state: MailState.READ}
    }).exec()

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
      player.sendMessage('mail/requestGiftReply', {ok: false, data: TianleErrorCode.configNotFound})
    }

    if (originalGiftMail.giftState === GiftState.AVAILABLE) {
      let updatedModel = await PlayerModel.findByIdAndUpdate({_id: player._id},
        {$inc: originalGiftMail.gift},
        {new: true, select: {diamond: 1, gold: 1}, rawResult: true}).lean().exec()

      if (updatedModel) {
        // 更新玩家的金币，钻石
        await player.updateResource2Client()
        player.sendMessage('mail/requestGiftReply', {ok: true});
        if (originalGiftMail.gift.diamond > 0) {
          await service.playerService.logGemConsume(player.model._id,
            originalGiftMail.gift.source ? ConsumeLogType.chargeByMail : ConsumeLogType.chargeByActive,
            originalGiftMail.gift.diamond, player.model.diamond + originalGiftMail.gift.diamond,
            `邮件赠送获得钻石${originalGiftMail.gift.diamond}个`);
        }
      }
    } else {
      player.sendMessage('mail/requestGiftReply', {ok: false, data: originalGiftMail.gift})
    }
  },
  'mail/requestNoticeGift': async function (player, {_id}) {
    const giftMail = await PublicMailModel.findOneAndUpdate({_id, type: MailType.NOTICEGIFT}, {
      $set: {giftState: GiftState.REQUESTED}
    })

    if (giftMail) {
      const unlock = await userLock(`gr${player._id}`, 3000)
      try {
        const record = await PublicMailRecordModel.findOneAndUpdate({mail: _id, player: player._id},
          {$set: {giftState: GiftState.REQUESTED}},
          {upsert: true, setDefaultsOnInsert: true}
        )

        if (record && record.giftState === GiftState.REQUESTED) {
          return player.sendMessage('mail/requestNoticeGiftReply', {ok: false, data: TianleErrorCode.configNotFound});
        }
        await PlayerModel.findByIdAndUpdate({_id: player._id},
          {$inc: giftMail.gift},
          {new: true, select: {diamond: 1, gold: 1}, rawResult: true}).lean().exec()

        await player.updateResource2Client()
        player.sendMessage('mail/requestNoticeGiftReply', {ok: true, data: giftMail.gift});
        if (giftMail.gift.diamond > 0) {
          new DiamondRecord({
            player: player.model._id,
            amount: giftMail.gift.diamond,
            residue: player.model.diamond + giftMail.gift.diamond,
            type: giftMail.gift.source ? ConsumeLogType.chargeByPublicMail : ConsumeLogType.chargeByActive,
            note: `系统邮件赠送获得钻石${giftMail.gift.diamond}个`,
          }).save()
        }
      } catch (e) {
        player.sendMessage('mail/requestNoticeGiftReply', {ok: false, data: TianleErrorCode.systemError})
      } finally {
        unlock()
      }
    } else {
      player.sendMessage('mail/requestNoticeGiftReply', {ok: false, data: TianleErrorCode.configNotFound})
    }
  }
}

export default handler

