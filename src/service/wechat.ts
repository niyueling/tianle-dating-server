import * as querystring from "querystring";
import * as config from '../config'
import BaseService from "./base";
import {service} from "./importService";

// 微信登录等
export default class Wechat extends BaseService {

  // 获取 access token
  async getAccessToken(code, appId, secret) {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    const result = await service.base.getByJson(url);
    this.logger.debug('get access token result', result.data);
    if (result.status !== 200 || result.data.errcode) {
      // 获取失败
      this.logger.error('get access token fail for code', code, result.data);
      return null;
    }
    const data = result.data;
    return {
      accessToken: data.access_token,
      openID: data.openid,
      openid: data.openid,
      unionID: data.unionid,
      unionid: data.unionid,
      refreshToken: data.refresh_token,
    };
  }

  // 获取微信用户信息
  async getUserInfo(accessToken, openID) {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openID}`;
    const result = await service.base.getByJson(url);
    this.logger.debug('get user info', result.data);
    if (result.status !== 200 || result.data.errcode) {
      this.logger.error('get user info fail for openid', openID, result.data);
      return null;
    }
    const data = result.data;
    return {
      openID: data.openid,
      openid: data.openid,
      nickname: data.nickname,
      sex: data.sex,
      headimgurl: data.headimgurl,
      unionID: data.unionid,
      unionid: data.unionid,
    };
  }

  // 根据微信小程序登录
  async getWechatInfoByQuickApp(appId, secret, code) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    const result = await service.base.getByJson(url);
    this.logger.debug('get user info by quick app', result.data);
    if (result.status !== 200 || result.data.errcode) {
      this.logger.error('get user info fail for code', code, result.data);
      return null;
    }
    const data = result.data;
    return {
      openID: data.openid,
      openid: data.openid,
      sessionKey: data.session_key,
      session_key: data.session_key,
      unionID: data.unionid,
      unionid: data.unionid,
    };
  }

  // 根据qq登录
  async getQqInfoBycode(appId, secret, code) {
    const url = `https://api.q.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    const result = await service.base.getByJson(url);
    this.logger.debug('get user info by qq game', result.data);
    if (result.status !== 200 || result.data.errcode) {
      this.logger.error('get qq user info fail for code', code, result.data);
      return null;
    }
    const data = result.data;

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid,
    };
  }

  urlForAuthorizeCode(redirectUrl, state?) {
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.wechat.publicAppId}&redirect_uri=${querystring.escape(redirectUrl)}&response_type=code&scope=snsapi_userinfo&state=${state || ''}#wechat_redirect`
  }

  // 根据 code 获取用户信息
  async getUserInfoByCode(code) {
    const resp = await this.getAccessToken(code,
      config.wechat.publicAppId, config.wechat.publicSecret);
    if (!resp) {
      return null;
    }
    const { accessToken, openID } = resp;
    return this.getUserInfo(accessToken, openID);
  }
}
