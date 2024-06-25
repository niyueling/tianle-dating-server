import PlayerItem from "../database/models/playerItem";
import BaseService from "./base";
import PlayerProp from "../database/models/PlayerProp";

// 道具
export default class ItemService extends BaseService {
  // 添加道具
  async addItem(playerId, shortId, itemType, count) {
    const record = await PlayerItem.findOne({
      shortId,
      itemType,
    })
    if (record) {
      record.itemCount += count;
      await record.save();
    } else {
      await PlayerItem.create({
        playerId,
        shortId,
        itemType,
        itemCount: count,
      })
    }
  }

  // 使用道具
  async useItem(playerId, item, count) {
    const record = await PlayerProp.findOne({
      playerId,
      propType: 4,
      childType: item.orderType
    })
    if (!record || record.number < count) {
      // 数量不足
      return false;
    }
    record.number -= count;
    await record.save();
    return true;
  }

  // 获取道具数量
  async getItemCount(playerId, item) {
    const record = await PlayerProp.findOne({
      playerId,
      propType: 4,
      childType: item.orderType
    })
    if (record) {
      return record.number;
    }
    return 0;
  }
}
