
import PlayerModel from '../database/models/player'
import RankList from '../database/models/rankList'


async function update(): Promise<void> {

  const players = await PlayerModel
    .find()
    .sort({gold: -1})
    .limit(30)
    .select({name: 1, headImgUrl: 1, shortId: 1, gold: 1})
    .lean().exec()


  await new RankList({players}).save()
  // await PlayerModel.update({}, {gold: 0}, {multi: true}).exec()
}

if (!module.parent) {
  update()
}


export default update
