import PlayerModel from '../database/models/player'

async function update(): Promise<void> {
  await PlayerModel
    .update({ruby: {$lt: 1000}}, {$set: {ruby: 1000}}, {multi: true})
    .exec()
}

if (!module.parent) {
  update()
}


export default update
