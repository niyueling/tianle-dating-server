import * as fs from 'fs'
import * as path from 'path'
import BaseService from "./base";
import ClubService from "./club";
import GameConfig from "./gameConfig";
import GoodsService from "./goods";
import InviteService from "./invite";
import Lottery from "./lottery";
import MedalService from "./medal";
import PlayerService from "./playerService";
import RegionService from "./region";
import RoomRegister from "./roomRegister";
import TimesService from "./times";
import QianService from "./qian";
import ItemService from "./item";
import UtilsService from "./utils";
import Wechat from "./wechat";
import WechatPay from "./wechatPay";
import RegressionService from "./regressionService";

export interface ServiceType {
  // 文件名：函数名
  base: BaseService,
  region: RegionService,
  goods: GoodsService,
  roomRegister: RoomRegister,
  club: ClubService,
  wechatPay: WechatPay,
  wechat: Wechat,
  utils: UtilsService,
  invite: InviteService,
  playerService: PlayerService,
  medal: MedalService,
  lottery: Lottery,
  gameConfig: GameConfig,
  times: TimesService,
  qian: QianService,
  item: ItemService,
  regression: RegressionService
}

// 导出 service 目录下的所有 service
// @ts-ignore
export const service: ServiceType = {}
const files = fs.readdirSync(__dirname).filter(
    filename => !filename.startsWith('importService') && (filename.endsWith('.ts') || filename.endsWith('.js'))
);

const requires = {};
files.map(f => {
    const moduleName = f.slice(0, -3);
    requires[moduleName] = require(path.join(__dirname, f));
});

for (const k of Object.keys(requires)) {
    const mod = requires[k];
    if (mod.default) {
        // 使用 default 导出
        // FIXME 处理 static 函数调用
      if (mod.default instanceof Function) {
        service[k] = new mod.default();
      }
    } else {
        // 简单处理
        throw new Error('使用 default 导出 service' + k)
    }
}

// console.log('check limitRate');
// service.utils.isApiRateLimit('account/login', 'test').then(res => {
//   console.log('limit rate', res)
//   service.utils.isApiRateLimit('account/login', 'test').then(res2 => {
//     console.log('limit rate 2', res2)
//   })
// });
