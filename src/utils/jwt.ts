import * as jwt from 'jsonwebtoken';
import * as config from "../config";
import {PlayerTokenModel} from "../database/models/playerToken";

// 签名
export function sign(payload) {
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;
  return jwt.sign(payload, secret, { expiresIn });
}

// 检验
export function verify(token) {
  const secret = config.jwt.secret;
  let isOk = true;
  try {
    const decoded = jwt.verify(token, secret);
    return { isOk, data: decoded };
  } catch (err) {
    console.error('invalid jwt token', token);
    isOk = false;
    return { isOk };
  }
}

export async function signAndRecord(payload, playerId) {
  let oldToken = await PlayerTokenModel.findOne({ playerId });
  if (!oldToken) {
    // 新建
    oldToken = await PlayerTokenModel.create({
      playerId,
      tokenIndex: 0,
    });
  }
  oldToken.tokenIndex ++;
  await oldToken.save();
  payload.tokenIndex = oldToken.tokenIndex;
  return sign(payload);
}

export async function verifyWithRecord(token) {
  const { isOk, data } = verify(token);
  if (!isOk) {
    return { isOk };
  }
  // 检查是不是最新的 token
  console.error(data)
  const oldToken = await PlayerTokenModel.findOne({ playerId: data.playerId });

  if (oldToken && oldToken.tokenIndex === data.tokenIndex) {
    return { isOk, data };
  }
  return { isOk: false }
}
