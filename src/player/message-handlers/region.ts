import Player from "../../database/models/player";
import {RegionModel} from "../../database/models/region";
import {addApi, BaseApi} from "./baseApi";

// 区域
export class Region extends BaseApi {

    // 获取所有区域
    @addApi()
    async getAllRegion() {
        const records = await RegionModel.find();
        const resp = {};
        for (const r of records) {
          if (resp[r.city]) {
            resp[r.city].push(r.county);
          } else {
            resp[r.city] = [r.county];
          }
        }
        this.replySuccess(resp);
    }

    // 选择区域
    @addApi({
      rule: {
        city: 'string',
        county: 'string',
      },
    })
    async selectRegion(message) {
        const region = await this.service.region.mustGetRegion(message.city, message.county);
        const playerModel = await Player.findById(this.player.id);
        playerModel.region = region._id;
        this.player.model.region = region._id;
        await playerModel.save();
        // 查找游戏类型
        const games = await this.service.region.findGameByRegionId(region._id);
        const gameTypes = this.service.base.getValueFromList(games, 'gameName')
        this.replySuccess(gameTypes);
    }
}
