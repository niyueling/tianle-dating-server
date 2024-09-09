import TurntablePrize from "../database/models/turntablePrize";
import {service} from "../service/importService";

describe('测试幸运转盘', function () {
  it('转盘1万次', async function () {
    let results = [];
    let datas = {};

    const user = await this.service.playerService.getPlayerModel("66d8208f2e0262636dfec158");

    const result = await TurntablePrize.find();
    for (const conf of result) {
      results.push({
        prizeId: conf._id,
        probability: conf.probability,
        num: conf.num,
        type: conf.type
      })
    }

    // 抽奖一万次
    for (let i = 0; i < 10000; i++) {
      const draw = await service.playerService.draw(user);
      if (draw.isOk) {
        result.push({
          // 中奖记录 id
          recordId: draw.record._id,
          // 中奖 id
          prizeId: draw.record.prizeId,
          // 是否中奖
          isHit: draw.record.isHit,
          num: draw.record.prizeConfig && draw.record.prizeConfig.num,
          type: draw.record.prizeConfig && draw.record.prizeConfig.type,
          turntableTimes: draw.times
        });

        if (datas[draw.record._id]) {
          datas[draw.record._id].count++;
        } else {
          datas[draw.record._id] = {recordId: draw.record._id, num: draw.record.prizeConfig && draw.record.prizeConfig.num, type: draw.record.prizeConfig && draw.record.prizeConfig.type, count: 0};
        }
      }
    }

    console.log("datas-%s", JSON.stringify(datas))
  })

})

