import Player from "../database/models/player";

async function updateRobotAvatar() {
  const players = await Player.find({robot: true});
  const url = "https://im-serve.oss-cn-beijing.aliyuncs.com/uploads/images/";
  const datas = [];

  for (let i = 0; i < players.length; i++) {
    if (i < 215) {
      const avatar = `${url}${i + 1}.png`;
      players[i].avatar = avatar;
      datas.push(avatar);
    } else {
      const index = Math.floor(Math.random() * (215 - 1 + 1)) + 1;
      const avatar = `${url}${index}.png`;
      players[i].avatar = avatar;
      datas.push(avatar);
    }

    await players[i].save();
  }

  console.warn(datas);
}


export default updateRobotAvatar;

