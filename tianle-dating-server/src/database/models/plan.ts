import {prop, Typegoose} from 'pshu-typegoose'

class GmPlan extends Typegoose {

  @prop({required: true})
  gem: number

  @prop({required: true})
  price: number

  @prop({required: true})
  name: string

  @prop({required: true})
  order: number

  @prop({required: true, default: true})
  highlight: boolean
}

export const GmPlanModel = new GmPlan().getModelForClass(GmPlan)
