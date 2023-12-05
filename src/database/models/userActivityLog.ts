import {Typegoose, prop, index} from 'pshu-typegoose'


@index({day: -1, category: 1})
class UserActivityLog extends Typegoose {

  @prop({required: true, index: true})
  day: Date

  @prop({required: true})
  category: string

  @prop()
  count: number
}


@index({day: -1}, {unique: true})
class UsersCountLog extends Typegoose {

  @prop({required: true})
  day: Date

  @prop({required: true})
  count: number

}


export const UserActivityLogModel = new UserActivityLog().getModelForClass(UserActivityLog)
export const UsersCountLogModel = new UsersCountLog().getModelForClass(UsersCountLog)
