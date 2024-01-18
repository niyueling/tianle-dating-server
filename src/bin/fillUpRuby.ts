import PlayerModel from '../database/models/player'

async function update(): Promise<void> {
  await PlayerModel
    .update({gold: {$lt: 1000}}, {$set: {gold: 1000}}, {multi: true})
    .exec()
}

if (!module.parent) {
  update()
}


export default update
