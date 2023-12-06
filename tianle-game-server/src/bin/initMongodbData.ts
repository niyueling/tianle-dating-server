import ClubGlobal from '../database/models/clubGlobal'
const allGameName = ['zhadan', 'majiang', 'biaofen', 'paodekuai',  'shisanshui']

// 作废, 战队不分游戏
async function  initClub() {
  for (let index = 0; index < allGameName.length; index++) {
    const gameName = allGameName[index];
    const have = await ClubGlobal.findOne({type: gameName})
    if (!have) {
      await ClubGlobal.create({
        type: gameName,
        shortIdCounter: 100000 * index
      })
    }
  }
}
// initClub();
