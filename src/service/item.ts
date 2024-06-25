import PlayerItem from "../database/models/playerItem";
import BaseService from "./base";

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
  async useItem(shortId, itemType, count) {
    const record = await PlayerItem.findOne({
      shortId,
      itemType,
    })
    if (!record || record.itemCount < count) {
      // 数量不足
      return false;
    }
    record.itemCount -= count;
    await record.save();
    return true;
  }

  // 获取道具数量
  async getItemCount(shortId, itemType) {
    const record = await PlayerItem.findOne({
      shortId,
      itemType,
    })
    if (record) {
      return record.itemCount;
    }
    return 0;
  }
}
