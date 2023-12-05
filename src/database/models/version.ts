import {prop, Typegoose} from 'pshu-typegoose'

// app 版本
class Version extends Typegoose {

  // apple 审核版本
  @prop({required: true})
  auditVersion: string
}

export const VersionModel = new Version().getModelForClass(Version)
