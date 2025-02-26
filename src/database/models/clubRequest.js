'use strict';

const mongoose = require('mongoose');

const ClubRequestSchema = new mongoose.Schema({
  playerId: {type: String, required: true, ref: 'Player'},
  clubShortId: {type: Number, required: true},
  playerName: {type: String, required: true},
  avatar: {type: String, required: true},
  playerShortId: {type: Number, required: true},
  type: {type: Number, default: 1},
  partner: {type: Number},
  status: {type: Number, default: 0},
  createAt: {type: Date, required: true, default: Date.now},
});

ClubRequestSchema.index({createAt: -1});
ClubRequestSchema.index({clubShortId: 1});

const ClubRequest = mongoose.model('ClubRequest', ClubRequestSchema);
export default ClubRequest
