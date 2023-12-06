import {RedisKey} from "@fm/common/constants";
import UserRecord from "../database/models/userRecord";
import {service} from "../service/importService";

// 更新邀请人收益
async function updateInvite() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateInviteProfitLock, 3600);
  if (!lock) {
    // 有进程在处理
    console.log('anther processing')
    return;
  }
  const allRecord = await UserRecord.find({
    isInvite: { $ne: true },
    source: 'wechat',
    currency: 'cash',
  });
  if (allRecord.length > 0) {
    console.log('update invite profit', new Date().toLocaleString());
  }
  for (const record of allRecord) {
    await service.invite.addInviteeOrder(record.to, record._id, record.amount)
    record.isInvite = true;
    await record.save();
  }
  return lock.unlock();
}

export default updateInvite
