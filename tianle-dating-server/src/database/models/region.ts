import {prop, Typegoose} from 'pshu-typegoose'

// 区域
class Region extends Typegoose {

  // 市
  @prop({required: true})
  city: string

  // 县
  @prop({required: true})
  county: string
}

export const RegionModel = new Region().getModelForClass(Region)
