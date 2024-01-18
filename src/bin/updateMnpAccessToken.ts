import {RedisKey} from "@fm/common/constants";
import UserRecord from "../database/models/userRecord";
import {service} from "../service/importService";
import GlobalConfig from "../database/models/globalConfig";
import PlayerModel from "../database/models/player";

// 更新邀请人收益
async function updateMnpAccessToken() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateInviteProfitLock, 600);
  if (!lock) {
    // 有进程在处理
    console.log('another processing')
    return;
  }

  //获取小程序access_token
  const appid = await this.service.utils.getGlobalConfigByName("mini_app_id");
  const secret = await this.service.utils.getGlobalConfigByName("mini_app_secret");
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  const res = await this.service.base.curl(url, { method: "get"});
  const response = JSON.parse(res.data);
  await GlobalConfig.update({name: "MnpAccessToken"},
    {$inc: {value: response.access_token}});

  return lock.unlock();
}

export default updateMnpAccessToken;
