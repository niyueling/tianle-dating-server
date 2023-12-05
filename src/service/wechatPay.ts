import {PayMethod} from "@fm/common/constants";
import * as crypto from "crypto";
import * as fs from "fs";
import * as moment from "moment";
import * as forge from "node-forge";
import * as path from "path";
import * as xml2js from "xml2js";
import * as config from "../config";
import BaseService from "./base";

const wechatConf = config.wechat;
// 微信支付
export default class WechatPay extends BaseService {
  genOutTradeNo(orderNo) {
    // 添加 8 位随机数
    const nonce = this.randomStr(8);
    return orderNo + nonce;
  }

  // 发起商家转账
  async transferToOneUser(outTradeNo: string, transferName, remark, amount, openId) {
    const body = {
      // 申请商户号的 appid
      appid: wechatConf.appId,
      out_batch_no: outTradeNo,
      batch_name: transferName,
      batch_remark: remark,
      total_amount: amount,
      total_num: 1,
      transfer_detail_list: [
        {
          out_detail_no: outTradeNo,
          transfer_amount: amount,
          transfer_remark: remark,
          openid: openId,
        }
      ],
    }
    return this.sendTransaction('https://api.mch.weixin.qq.com/v3/transfer/batches', 'POST', body);
  }

  // 公众号内支付, 获取支付参数
  // https://pay.weixin.qq.com/wiki/doc/api/index.html
  async getJsPayParams(orderNo: string, payPrice, desc, openId, clientIp, detail, timeExpire?) {
    if (!timeExpire) {
      // 过期时间默认 15 分钟, YYYYMMDDHHmmss
      timeExpire = moment().add(15, 'm').format('YYYYMMDDHHmmss');
    }
    const body = {
      appid: wechatConf.publicAppId,
      mch_id: wechatConf.mchId,
      // 支付方式 + 金额 + 订单号
      out_trade_no: this.genOutTradeNo(orderNo),
      notify_url: wechatConf.notifyUrl,
      body: desc,
      total_fee: payPrice,
      spbill_create_ip: clientIp,
      openid: openId,
      trade_type: 'JSAPI',
      detail,
      time_expire: timeExpire,
    };
    const res = await this.sendTransactionV2('https://api.mch.weixin.qq.com/pay/unifiedorder', body, false);
    const params: any = {
      appId: wechatConf.publicAppId,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: this.randomStr(36),
      package: 'prepay_id=' + res.prepay_id,
      signType: 'HMAC-SHA256',
    }
    params.paySign = await this.signV2(params);
    return params;
  }

  // 使用 redis 缓存 wechat 公钥
  async getWechatPublicKey(serialNo) {
    const content = wechatConf.wechatCert[serialNo];
    if (content !== null) {
      return content;
    }
    // 本地没有，从服务器获取
    await this.queryWechatPublicKey();
    return wechatConf.wechatCert[serialNo];
  }

  // 退款
  // https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=9_4
  async refund(outTradeNo, refundNo, payPrice, refundFee, refundDesc) {
    const body: any = {};
    body.appid = wechatConf.appId;
    body.mch_id = wechatConf.mchId;
    body.out_trade_no = outTradeNo;
    body.out_refund_no = refundNo;
    body.total_fee = payPrice;
    body.refund_fee = refundFee;
    body.refund_desc = refundDesc;
    // 不需要通知
    // body.notify_url = wechatConf.refundNotifyUrl;
    const resp = await this.sendTransactionV2('https://api.mch.weixin.qq.com/secapi/pay/refund', body, true);
    if (resp.result_code === 'SUCCESS') {
      // 退款成功
      return [ resp, true ];
    }
    // TODO 退款失败,需要进一步处理
    return [ resp, false ];
  }

  // 查询订单
  // https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_2.shtml
  async queryOrder(wechatPayOrderNo) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/id/' + wechatPayOrderNo
      + '?mchid=' + wechatConf.mchId;
    return this.sendTransaction(url, 'GET', null);
  }

  // 关闭订单
  // https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_3.shtml
  async closeOrder(orderNo) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}/close`;
    const body = {
      mchid: wechatConf.mchId,
    };
    return this.sendTransaction(url, 'POST', body);
  }
  //
  // 查询退款
  async queryRefund(refundNo) {
    const body = {
      appid: wechatConf.appId,
      mch_id: wechatConf.mchId,
      out_refund_no: refundNo,
    };
    return this.sendTransactionV2('https://api.mch.weixin.qq.com/pay/refundquery', body);
  }

  // app 支付
  // https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_2_1.shtml
  async appPay(orderNo, payPrice, desc, timeExpire?) {
    if (!timeExpire) {
      // 过期时间默认 15 分钟, YYYYMMDDHHmmss
      timeExpire = moment().add(15, 'm').format('YYYYMMDDHHmmss');
    }
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/app';
    const outTradeNo = this.genOutTradeNo(orderNo);
    const body = {
      mchid: wechatConf.mchId,
      appid: wechatConf.appPayAppId,
      description: desc,
      out_trade_no: outTradeNo,
      time_expire: timeExpire,
      notify_url: wechatConf.notifyUrl,
      amount: {
        total: payPrice,
      }
    };
    return this.sendTransaction(url, 'POST', body);
  }

  async sendTransactionV2(url, params, withPfx = false) {
    params.sign_type = 'HMAC-SHA256';
    params.nonce_str = this.randomStr(32);
    const postParam = await this.genV2PostData(params);
    const passphrase = wechatConf.mchId;
    // 需要证书
    const res = await this.requestXML(url, 'post', postParam, withPfx, wechatConf.pfxContent, passphrase);
    const isOK = await this.validResponseV2(res);
    if (!isOK) {
      throw new Error('invalid response')
    }
    const resp = await this.parseXML(res.data);
    const returnCode = resp.return_code;
    const resultCode = resp.result_code;
    if (returnCode !== 'SUCCESS') {
      // 退款申请接收失败
      this.logger.error(`response from wechat ${JSON.stringify(res)}`);
      throw new Error('send fail, return_msg: ' + resp.return_msg);
    }
    if (resultCode === 'SYSTEMERROR' || resultCode === 'BIZERR_NEED_RETRY') {
      // 重试订单
      return this.sendTransactionV2(url, params);
    }
    if (resultCode !== 'SUCCESS') {
      throw new Error('send fail, err_code: ' + resp.err_code + ', err desc: ' + resp.err_code_des);
    }
    return resp;
  }

  // 发送交易
  async sendTransaction(url, method, data) {
    let dataString = '';
    if (data) {
      dataString = JSON.stringify(data);
    }
    let headers;
    let res;
    let isValid;
    switch (method) {
      case 'GET':
        headers = await this.buildHeader(url, 'GET', dataString);
        res = await this.getByJson(url, headers);
        // 验签
        isValid = await this.validResponse(res);
        if (!isValid) {
          throw new Error('微信支付验签失败或请求错误, fail to verify wechat pay');
        }
        return res;
      case 'POST':
        headers = await this.buildHeader(url, 'POST', dataString);
        res = await this.postByJson(url, data, headers);
        // 验签
        isValid = await this.validResponse(res);
        if (!isValid) {
          throw new Error('微信支付验签失败或请求错误, fail to verify wechat pay or request fail');
        }
        return res;
      default:
        throw new Error(`${method} does not supported`);
    }
  }

  // 签名
  // https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_0.shtml
  // HTTP请求方法\n
  // URL\n
  // 请求时间戳\n
  // 请求随机串\n
  // 请求报文主体\n
  async sign(url, method, body, nonce, timeStamp) {
    const signBody = [];
    signBody.push(method.toUpperCase());
    signBody.push(url);
    signBody.push(timeStamp.toString());
    signBody.push(nonce);
    signBody.push(body);
    const signString = signBody.join('\n') + '\n';
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signString);
    return signer.sign(wechatConf.pkContent, 'base64');
  }

  // 获取签名头
  async buildHeader(url, method, dataString) {
    // 获取参与签名的 url, 如 https://api.mch.weixin.qq.com/v3/certificates ，取 /v3/certificates
    const host = /https?.*weixin.qq.com/.exec(url)[0];
    const paramUrl = url.slice(host.length);
    const mchid = wechatConf.mchId;
    const serailNo = wechatConf.serialNo;
    const nonce = this.randomStr(36, false);
    const timeStamp = Math.floor(Date.now() / 1000);
    const signString = await this.sign(paramUrl, method, dataString, nonce, timeStamp);
    const token = `mchid="${mchid}",nonce_str="${nonce}",timestamp="${timeStamp}",serial_no="${serailNo}",signature="${signString}"`;
    return {
      Authorization: 'WECHATPAY2-SHA256-RSA2048 ' + token,
    };
  }

  // 获取微信支付公钥
  // https://pay.weixin.qq.com/wiki/doc/apiv3/apis/wechatpay5_1.shtml
  async queryWechatPublicKey() {
    const res = await this.sendTransaction('https://api.mch.weixin.qq.com/v3/certificates', 'GET', null);
    // 解密
    for (const data of res.data.data) {
      const serialNo = data.serial_no;
      const encrypted = data.encrypt_certificate;
      const associatedData = encrypted.associated_data;
      const ciphertext = encrypted.ciphertext;
      const nonce = encrypted.nonce;
      const alg = encrypted.algorithm;
      if (alg !== 'AEAD_AES_256_GCM') {
        // 微信支付加密算法更新了，需要升级
        this.logger.error('微信支付加密算法更新了，需要升级, invalid algorithm');
        throw new Error('获取微信支付公钥失败');
      }
      const decode = await this.decodeByAPIV3Secret(ciphertext, nonce, associatedData);
      // 从 pem 格式的cert证书中获取公钥。
      const publicCert = forge.pki.certificateFromPem(decode);
      const publicKey = forge.pki.publicKeyToPem(publicCert.publicKey);
      // 保存在 cert 目录下
      fs.writeFileSync(path.join(wechatConf.certPath, serialNo + '.pem'), publicKey);
      wechatConf.wechatCert[serialNo.toUpperCase()] = decode;
    }
  }
  async validResponse(resp) {
    if (resp.status === 204) {
      // 无内容，不需要验签
      return true;
    }
    if (resp.status !== 200) {
      // 出错了
      return false;
    }
    // 验签
    // 应答时间戳\n
    // 应答随机串\n
    // 应答报文主体\n
    const headers = resp.headers || resp.header;
    return this.rawValidResponse(headers, resp.data);
  }

  // 使用headers、data检查
  async rawValidResponse(headers, data) {
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const body = JSON.stringify(data);
    const verifyBody = [ timestamp, nonce, body ].join('\n') + '\n';
    const wechatSign = headers['wechatpay-signature'];
    const verify = crypto.createVerify('RSA-SHA256');
    verify.write(verifyBody);
    verify.end();
    const serialNo = headers['wechatpay-serial'];
    // 一定要有，否则会死循环
    const publicKey = await this.getWechatPublicKey(serialNo);
    return verify.verify(publicKey, wechatSign, 'base64');
  }

  // 使用 api v3 密钥解密
  // https://stackoverflow.com/questions/65606794/aead-aes-256-gcm-in-node-js
  async decodeByAPIV3Secret(ciphertext, nonce, associatedData) {
    const key = wechatConf.apiV3Secret;
    const decipher = crypto.createDecipheriv('AES-256-GCM', key, nonce);
    const encrypted = Buffer.from(ciphertext, 'base64');
    // @ts-ignore
    decipher.setAuthTag(encrypted.slice(-16));
    // @ts-ignore
    decipher.setAAD(Buffer.from(associatedData));
    const out = Buffer.concat([
      decipher.update(encrypted.slice(0, -16)),
      decipher.final(),
    ]);
    return out.toString();
  }

  // 使用微信证书加密
  // https://gist.github.com/sohamkamani/b14a9053551dbe59c39f83e25c829ea7
  // async encodeByWechatPublicKey(data) {
  //   const encryptedData = crypto.publicEncrypt(
  //     {
  //       key: publicKey,
  //       // @ts-ignore
  //       padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  //       oaepHash: "sha256",
  //     },
  //     // We convert the data string to a buffer using `Buffer.from`
  //     Buffer.from(data)
  //   )
  //   console.log("encrypted data: ", encryptedData.toString("base64"))
  // }

  // 解析 xml
  async parseXML(xmlData) {
    const opt = { trim: true, explicitArray: false, explicitRoot: false };
    return xml2js.parseStringPromise(xmlData, opt);
  }

  async validResponseV2(resp) {
    if (resp.status !== 200) {
      // 其它错误
      this.logger.error('refund fail', JSON.stringify(resp));
      return false;
    }
    return true;
  }

  async rawValidResponseV2(param) {
    // const param = await this.parseXML(rawXml);
    const respSign = param.sign;
    delete param.sign;
    const checkSign = await this.signV2(param);
    if (respSign !== checkSign) {
      this.logger.error(`invalid wechat pay params ${param}`);
      return false;
    }
    return true;
  }

  async requestXML(url, method, data, withpfx?: boolean, pfxContent?: Buffer, passphrase: string = '') {
    // this.logger.info(`post url: ${url}, data: ${JSON.stringify(data)}`);
    const headers = {
      'Content-Type': 'application/xml',
    };
    let res;
    if (!withpfx) {
      res = await this.curl(url, {
        method,
        headers,
        data,
      });
    } else {
      // 携带证书
      res = await this.curl(url, {
        method,
        headers,
        data,
        pfx: pfxContent,
        passphrase,
      });
    }
    // this.logger.info(`get response ${JSON.stringify(res)}`);
    return res;
  }
  //
  // 旧版 post， xml数据, 使用 sha256 算法
  async genV2PostData(params) {
    let keys = Object.keys(params);
    keys = keys.sort();
    let signString = '';
    for (const k of keys) {
      if (!params[k]) {
        // 空参数，不参与
        continue;
      }
      signString += `${k}=${params[k]}&`;
    }
    signString += `key=${wechatConf.apiV2Secret}`;
    const sign = crypto.createHmac('SHA256', wechatConf.apiV2Secret)
      .update(signString)
      .digest('hex')
      .toUpperCase();
    let data = '<xml>';
    for (const k of keys) {
      data += `<${k}><![CDATA[${params[k]}]]></${k}>`;
    }
    data += `<sign>${sign}</sign></xml>`;
    return data;
  }

  // 签名
  async signV2(params) {
    let keys = Object.keys(params);
    keys = keys.sort();
    let signString = '';
    for (const k of keys) {
      signString += `${k}=${params[k]}&`;
    }
    signString += `key=${wechatConf.apiV2Secret}`;
    return crypto.createHmac('SHA256', wechatConf.apiV2Secret)
      .update(signString)
      .digest('hex')
      .toUpperCase();
  }

  async orderNotifyByWechatPay(body, isV2) {
    let orderNo;
    let outTradeNo;
    let tradeNo;
    let status;
    let isOk = false;
    let appid;
    let mchid;
    let validAppId;
    let payType;
    if (isV2) {
      // 旧版
      if (body.return_code !== 'SUCCESS' || body.result_code !== 'SUCCESS') {
        return { isOk: false };
      }
      isOk = true;
      outTradeNo = body.out_trade_no;
      orderNo = body.out_trade_no.slice(0, body.out_trade_no.length - 8);
      tradeNo = body.transaction_id;
      // 业务状态
      status = body.result_code;
      appid = body.appid;
      mchid = body.mch_id;
      validAppId = wechatConf.publicAppId;
      payType = PayMethod.wechatJsPay;
    } else if (body.event_type && body.event_type === 'TRANSACTION.SUCCESS') {
      // 支付成功
      if (body.resource.algorithm !== 'AEAD_AES_256_GCM') {
        this.logger.error('invalid decode algorithm', body.resource.algorithm);
        return { isOk: false };
      }
      const associatedData = body.resource.associated_data;
      const ciphertext = body.resource.ciphertext;
      const nonce = body.resource.nonce;
      const decoded = await this.decodeByAPIV3Secret(ciphertext, nonce, associatedData);
      this.logger.debug('get decoded text', decoded);
      const resp = JSON.parse(decoded);
      isOk = true;
      outTradeNo = resp.out_trade_no;
      // 去除后面的8位随机数
      orderNo = outTradeNo.slice(0, outTradeNo.length - 8);
      tradeNo = resp.transaction_id;
      status = resp.trade_state;
      appid = resp.appid;
      mchid = resp.mchid;
      validAppId = wechatConf.appId;
      payType = PayMethod.wechatH5;
    }
    // 校验成功
    if (!isOk) {
      return { isOk: false };
    }
    if (appid !== validAppId || mchid !== wechatConf.mchId) {
      return { isOk: false };
    }
    return { isOk: true, orderNo, tradeNo, status, payType, outTradeNo };
  }
}
