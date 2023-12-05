import {index, ModelType, prop, Ref, Typegoose} from "pshu-typegoose";
import Player from "./player";

@index({player: 1, status: 1, createAt: -1})
@index({createAt: -1, status: 1})
export class RechargeWithOtherGameOrder extends Typegoose {
  @prop({required: true})
  _id; string

  @prop({required: true, ref: Player})
  player: string

  @prop({required: true})
  type: 'exchange' | 'consume' | 'refund'

  @prop({required: true})
  gameType: string

  @prop({required: true, default: 0})
  gem: number

  @prop({required: true, default: 0})
  gold: number

  @prop({required: true, default: 0})
  ruby: number

  @prop({required: true, default: () => new Date()})
  createAt: Date
}

export const RechargeWithOtherGameOrderModel: ModelType<RechargeWithOtherGameOrder> = new RechargeWithOtherGameOrder().getModelForClass(RechargeWithOtherGameOrder)
