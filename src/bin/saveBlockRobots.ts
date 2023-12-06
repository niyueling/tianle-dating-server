import {readFileSync} from 'fs'
import {join} from 'path'
import * as random from 'lodash/random'
import {service} from "../service/importService";
import BlockUser from "../database/models/blockUser";
async function main() {
  try {
    const profiles = readFileSync(join(__dirname, '..', '..', 'robots.json'), 'utf-8').trim().split('\n');
    const robots = [];
    let shortId = 1002000;

    for (let i = 0; i < profiles[i].length; i++) {
      let data = JSON.parse(profiles[i]);
      data.robot = true;
      data.shortId = shortId + i + 1;
      data.curLevel = random(3, 55);
      data.gem = random(30, 60);
      data.gold = random(100, 1000);
      const ipPrefix = [
        "1.2.2", "1.14.224", "36.149.155", "36.149.8", "14.197.149", "27.109.124",
        "61.237.127", "36.128.88", "27.221.192", "59.81.46", "1.25.152", "36.26.192",
      "42.247.2", "1.192.204", "43.247.222", "27.152.6", "42.247.13", "59.49.116", "39.166.119",
      "14.197.241", "36.32.248", "42.100.96", "58.59.176", "36.96.223", "39.129.104"];
      data.ip = `${ipPrefix[random(0, ipPrefix.length - 1)]}.${random(1, 254)}`;
      const result = await service.playerService.getLocation(data.ip);

      if (result.code === 200) {
        data.province = result.data.result.prov;
        data.city = result.data.result.city;
      }

      await BlockUser.create(data);
      robots.push(data);

      console.error("start insert");
      console.log(robots);
      console.error("end insert");
    }
  } catch(e) {
    console.log(e)
  }
}

main()

