import * as mongoose from 'mongoose'
import {prop, Typegoose} from 'pshu-typegoose'

// 区域
class RegionGame extends Typegoose {
  // 区域id
  @prop({required: true, ref: {name: 'Region'}})
  region: mongoose.Types.ObjectId

  // 游戏名
  @prop({required: true})
  gameName: string
}

export const RegionGameModel = new RegionGame().getModelForClass(RegionGame)

