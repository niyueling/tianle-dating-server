import {Typegoose, prop} from 'pshu-typegoose'


export class RewardConfig extends Typegoose {

  @prop({required: true})
  game: string

  @prop({required: true})
  redPocket: number
}


export const RewardConfigModel = new RewardConfig().getModelForClass(RewardConfig)
