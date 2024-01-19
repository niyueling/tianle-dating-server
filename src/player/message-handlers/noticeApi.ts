
import {addApi, BaseApi} from "./baseApi";
import Notice from "../../database/models/notice";

export class NoticeApi extends BaseApi {
  // 公告列表
  @addApi()
  async noticeLists(message) {
    let publicMails = await Notice.find({type: message.type}).sort({createAt: -1}).lean().exec();

    return this.replySuccess(publicMails);
  }
}
