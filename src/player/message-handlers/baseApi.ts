// 为接口函数添加记录
import * as winston from "winston";
import {ServiceType} from "../../service/importService";

export function addApi(opt?: { apiName?: string, rule?: object, resp?: object }) {
  // 检查参数
  let apiName = '';
  let rule = null;
  if (opt && opt.apiName) {
    // 没有接口名
    apiName = opt.apiName;
  }
  if (opt && opt.rule) {
    rule = opt.rule;
  }
  return function (target, name, descriptor) {
    if (!apiName) {
      // 设置为接口名
      apiName = name;
    }
    if (!target.__apiMap) {
      target.__apiMap = new Map();
    }
    if (!target.__apiRule) {
      target.__apiRule = new Map();
    }
    target.__apiMap.set(apiName, name);
    // 不校验参数
    if (!rule) {
      return descriptor;
    }
    target.__apiRule.set(apiName, rule);
    return descriptor;
  }
}

// 查询接口
export class BaseApi {
  // 接口名
  protected readonly apiRoute: string;
  // 玩家 socket
  protected readonly player: any;
  // 注入所有的 service
  protected readonly service: ServiceType;
  protected logger: winston.Winston;

  constructor(apiRoute: string, player: any, service?: ServiceType) {
    this.apiRoute = apiRoute;
    this.player = player;
    this.service = service;
    this.logger = winston;
  }

  // 发送消息
  sendMessage(player: any, apiName: string, data: any) {
    player.sendMessage(apiName, data)
  }

  // 查询失败
  replyFail(info: string, data = {}) {
    return this.player.sendMessage(this.apiRoute + 'Reply', {ok: false, info, data})
  }

  // 失败下发 data
  replyFailWithData(info: string, data) {
    return this.player.sendMessage(this.apiRoute + 'Reply', {ok: false, info, data})
  }

  // 兼容
  replyFailWithInfo(info: string, data = {}) {
    return this.player.sendMessage(this.apiRoute + 'Reply', {ok: false, info, ...data})
  }

  // 兼容旧接口
  replyFailWithName(name: string, info?: string, data?: any) {
    if (!data) {
      return this.player.sendMessage(name, {ok: false, info: info || ''})
    }
    return this.player.sendMessage(name, { ok: false, info: info || '', ...data})
  }

  // 查询成功
  replySuccess(data = {}) {
    return this.player.sendMessage(this.apiRoute + 'Reply', {ok: true, data})
  }

  // 兼容旧接口
  replySuccessWithInfo(info, data = {}) {
    return this.player.sendMessage(this.apiRoute + 'Reply', {ok: true, info, ...data})
  }

  // 兼容旧接口
  replySuccessWithName(name, info, data?) {
    if (!data) {
      return this.player.sendMessage(name, {ok: true, info: info || ''})
    }
    return this.player.sendMessage(name, { ok: true, info: info || '', ...data})
  }

  // 直接下发数据
  replySuccessDirect(data, name?) {
    if (!name) {
      name = this.apiRoute + 'Reply';
    }
    return this.player.sendMessage(name, data)
  }

  // 接口限流
  async isApiRateLimit(playerId) {
    return this.service.utils.isApiRateLimit(this.apiRoute, playerId);
  }
}
