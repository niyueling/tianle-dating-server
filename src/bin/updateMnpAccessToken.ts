import {RedisKey} from "@fm/common/constants";
import {service} from "../service/importService";
import GlobalConfig from "../database/models/globalConfig";

// 15分钟定时更新小游戏accessToken
async function updateMnpAccessToken() {
  const lock = await service.utils.grantLockOnce(RedisKey.updateInviteProfitLock, 60);
  if (!lock) {
    // 有进程在处理
    console.log('another processing')
    return;
  }

  //获取小程序access_token
  const appid = await service.utils.getGlobalConfigByName("mini_app_id");
  const secret = await service.utils.getGlobalConfigByName("mini_app_secret");
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  const res = await service.base.curl(url, { method: "get"});
  const response = JSON.parse(res.data);
  await GlobalConfig.update({name: "MnpAccessToken"},
    {$set: {value: response.access_token}});

  return lock.unlock();
}

export default updateMnpAccessToken;
