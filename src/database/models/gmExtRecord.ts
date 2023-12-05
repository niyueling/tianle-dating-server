import * as mongoose from "mongoose"
import {prop, Typegoose} from 'pshu-typegoose'

export class GmExtRecord extends Typegoose {
  @prop({required: true})
  price: number;

  @prop({required: true})
  gem: number;

  @prop({required: true, ref: {name: 'GM'}, index: true})
  gm: mongoose.Schema.Types.ObjectId;

  @prop({required: true})
  oid: string

  @prop({default: 'pending', index: true})
  status: string

  @prop({required: true, default: 'ext'})
  source: string

  @prop({required: true, default: Date.now})
  createAt: Date;

  @prop({required: true})
  extras: any;

  @prop()
  notification: any
}

export const GmExtRecordModel = new GmExtRecord().getModelForClass(GmExtRecord);

export default GmExtRecordModel
