'use strict'

const mongoose = require('mongoose');

const diamondRecordSchema = new mongoose.Schema({
  player: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  residue: {
    type: Number,
    required: true
  },
  type: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    required: false
  },
  createAt: {type: Date, default: Date.now},
})

diamondRecordSchema.index({player: 1});
diamondRecordSchema.index({type: 1});

const BlockDiamondRecord = mongoose.model('BlockDiamondRecord', diamondRecordSchema)
export default BlockDiamondRecord
