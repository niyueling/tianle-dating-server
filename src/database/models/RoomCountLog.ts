import {Typegoose, prop, index} from 'pshu-typegoose'

@index({day: 1, category: 1}, {unique: true})
class RoomCountLog extends Typegoose {

  @prop({required: true})
  day: Date

  @prop({required: true})
  category: string

  @prop({required: true})
  count: number
}


export const RoomCountLogModel = new RoomCountLog().getModelForClass(RoomCountLog)
