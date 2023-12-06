import * as mongoose from 'mongoose'
import {prop, Typegoose} from 'pshu-typegoose'

// 商品
class PlayerToken extends Typegoose {

  // 用户 id
  @prop({required: true})
  playerId: mongoose.Types.ObjectId

  // token index
  @prop({required: true})
  tokenIndex: number
}

export const PlayerTokenModel = new PlayerToken().getModelForClass(PlayerToken)
