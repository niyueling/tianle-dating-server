import {ApplePrice} from "@fm/common/constants";
import GoodsModel from "../../database/models/goods";
import GoodsExchangeRuby from "../../database/models/goodsExchangeRuby";
import {addApi, BaseApi} from "./baseApi";

// 商品
export class GoodsApi extends BaseApi {
  // 所有商品列表
  @addApi()
  async getGoodsList() {
    const goodsList = await GoodsModel.find({ isOnline: true });
    for (const r of goodsList) {
      r.applePrice = ApplePrice[r.applePriceId] || '无';
    }
    const rubyList = await GoodsExchangeRuby.find();
    this.replySuccess({ goodsList, rubyList });
  }
}
