import * as fs from "fs";
import * as mongoose from "mongoose";
import * as process from "process";
import * as readline from "readline";
import * as config from "../config"
import Player from "../database/models/player";
import {service} from "../service/importService";

mongoose.connect(config.database.url);
// 按行读取文件
const lineReader = readline.createInterface({
  input: fs.createReadStream('../../src/bin/robot.txt')
});

const robots = [];
lineReader.on('line', function (line) {
  const lines = line.split('\t');
  if (lines.length === 4) {
    // 第一个是昵称(base64), 第二个是性别，第三个头像地址
    const name = Buffer.from(lines[0], 'base64').toString('utf8');
    robots.push({
      name,
      sex: lines[1],
      headImgUrl: lines[2],
      platform: 'robot',
    })
  }
});

lineReader.on('close', async function () {
  // 写入数据库
  for (const r of robots) {
    const robot = await Player.findOne({
      headImgUrl: r.headImgUrl,
      platform: 'robot',
    })
    if (robot) {
      console.log('head url', r.headImgUrl)
      robot.headImgUrl = r.headImgUrl;
      await robot.save();
      continue;
    }
    await service.playerService.createNewPlayer(r);
  }
  process.exit(0)
});
