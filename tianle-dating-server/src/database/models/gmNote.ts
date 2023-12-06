import * as mongoose from "mongoose"
import {prop, Typegoose} from 'pshu-typegoose'

export class GmNote extends Typegoose {
  @prop({required: true, ref: {name: 'GM'}, index: true})
  gm: mongoose.Schema.Types.ObjectId;

  @prop({required: true})
  note: string

  @prop({required: true, default: Date.now})
  createAt: Date;
}


export const GmNoteModel = new GmNote().getModelForClass(GmNote);

export default GmNoteModel
