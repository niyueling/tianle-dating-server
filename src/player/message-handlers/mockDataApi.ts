
import BlockDailySignPrize from "../../database/models/blockDailySignPrize";
import BlockDailySignTotalPrize from "../../database/models/blockDailySignTotalPrize";
import BlockRoleBase from "../../database/models/blockRoleBase";
import BlockRoleSummon from "../../database/models/blockRoleSummon";
import BlockTask from "../../database/models/blockTask";
import BlockTaskTotalPrize from "../../database/models/blockTaskTotalPrize";
import {addApi, BaseApi} from "./baseApi";
import BlockSevenTask from "../../database/models/blockSevenTask";
import BlockSevenTaskTotalPrize from "../../database/models/blockSevenTaskTotalPrize";
import BlockPrize from "../../database/models/blockPrize";
import BlockSevenSignPrize from "../../database/models/blockSevenSignPrize";
import BlockShopGiftLevel from "../../database/models/blockShopGiftLevel";
import BlockWaveNumber from "../../database/models/blockWaveNumber";
import Player from "../../database/models/player";
import BlockCurLevel from "../../database/models/blockCurLevel";
import TurntablePrize from "../../database/models/turntablePrize";

export class MockDataApi extends BaseApi {
  // 录入转盘数据
  @addApi()
  async saveActiveGift() {
    const result = await TurntablePrize.find();

    if (result.length) {
      await TurntablePrize.remove({_id: {$ne: null}}).exec();
    }

    const gifts = [
        {probability: 0.2, num: 10, residueNum: 10000, type: 1},
        {probability: 0.2, num: 100000000, residueNum: 10000, type: 2},
        {probability: 0.1, num: 20, residueNum: 10000, type: 1},
        {probability: 0.1, num: 500000000, residueNum: 10000, type: 2},
        {probability: 0.08, num: 30, residueNum: 10000, type: 1},
        {probability: 0.08, num: 1000000000, residueNum: 10000, type: 2},
        {probability: 0.05, num: 50, residueNum: 10000, type: 1},
        {probability: 0.05, num: 3000000000, residueNum: 10000, type: 2},
        {probability: 0.03, num: 80, residueNum: 10000, type: 1},
        {probability: 0.03, num: 5000000000, residueNum: 10000, type: 2},
        {probability: 0.02, num: 100, residueNum: 10000, type: 1},
        {probability: 0.02, num: 10000000000, residueNum: 10000, type: 2},
        {probability: 0.01, num: 150, residueNum: 10000, type: 1},
        {probability: 0.01, num: 15000000000, residueNum: 10000, type: 2},
        {probability: 0.01, num: 288, residueNum: 10000, type: 1},
        {probability: 0.01, num: 88800000000, residueNum: 10000, type: 2},
    ];

    TurntablePrize.insertMany(gifts);
    return this.replySuccess(gifts);
  }

  // 录入每日签到数据
  @addApi()
  async saveDailySignData() {
    const result = await BlockDailySignPrize.find();

    if (result.length) {
      await BlockDailySignPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {number: 50, level: 1, type: 1, propId: 102, day: 1},
      {number: 500, level: 1, type: 0, propId: 103, day: 2},
      {number: 5, level: 1, type: 2, propId: 101, day: 3},
      {number: 5, level: 1, type: 3, propId: 116, day: 4},
      {number: 100, level: 1, type: 1, propId: 102, day: 5},
      {number: 50, level: 1, type: 1, propId: 102, day: 6},
      {number: 1000, level: 1, type: 0, propId: 103, day: 7},
      {number: 5, level: 1, type: 2, propId: 101, day: 8},
      {number: 5, level: 1, type: 3, propId: 116, day: 9},
      {number: 100, level: 1, type: 1, propId: 102, day: 10},
      {number: 50, level: 1, type: 1, propId: 102, day: 11},
      {number: 1500, level: 1, type: 0, propId: 103, day: 12},
      {number: 5, level: 1, type: 2, propId: 101, day: 13},
      {number: 10, level: 1, type: 3, propId: 116, day: 14},
      {number: 100, level: 1, type: 1, propId: 102, day: 15},
      {number: 50, level: 1, type: 1, propId: 102, day: 16},
      {number: 2000, level: 1, type: 0, propId: 103, day: 17},
      {number: 5, level: 1, type: 2, propId: 101, day: 18},
      {number: 10, level: 1, type: 3, propId: 116, day: 19},
      {number: 100, level: 1, type: 1, propId: 102, day: 20},
      {number: 50, level: 1, type: 1, propId: 102, day: 21},
      {number: 2500, level: 1, type: 0, propId: 103, day: 22},
      {number: 10, level: 1, type: 2, propId: 101, day: 23},
      {number: 10, level: 1, type: 3, propId: 116, day: 24},
      {number: 200, level: 1, type: 1, propId: 102, day: 25},
      {number: 50, level: 1, type: 1, propId: 102, day: 26},
      {number: 3000, level: 1, type: 0, propId: 103, day: 27},
      {number: 10, level: 1, type: 2, propId: 101, day: 28},
      {number: 10, level: 1, type: 3, propId: 116, day: 29},
      {number: 300, level: 1, type: 1, propId: 102, day: 30},
    ];

    BlockDailySignPrize.insertMany(datas);

    const result1 = await BlockDailySignTotalPrize.find();

    if (result1.length) {
      await BlockDailySignTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {number: 2000, level: 1, type: 1, propId: 102, liveness: 7},
      {number: 3000, level: 1, type: 1, propId: 102, liveness: 14},
      {number: 4000, level: 1, type: 1, propId: 102, liveness: 21},
      {number: 5000, level: 1, type: 1, propId: 102, liveness: 28}
    ];

    BlockDailySignTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入士兵/英雄数据
  @addApi()
  async saveRoleBaseData() {
    const result = await BlockRoleBase.find();

    if (result.length) {
      await BlockRoleBase.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {type: 1, roleId: 104, upgradeDebris: 5, quality: 'N', weight: 16, summonDebris: [1, 5], baseId: 1001, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 105, upgradeDebris: 5, quality: 'N', weight: 14, summonDebris: [1, 5], baseId: 1002, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 106, upgradeDebris: 5, quality: 'N', weight: 15, summonDebris: [1, 5], baseId: 1003, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 107, upgradeDebris: 5, quality: 'N', weight: 14, summonDebris: [1, 5], baseId: 1004, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 108, upgradeDebris: 10, quality: 'R', weight: 9, summonDebris: [1, 10], baseId: 1005, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 109, upgradeDebris: 10, quality: 'R', weight: 8, summonDebris: [1, 10], baseId: 1006, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 110, upgradeDebris: 10, quality: 'R', weight: 7, summonDebris: [1, 10], baseId: 1007, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 111, upgradeDebris: 10, quality: 'R', weight: 8, summonDebris: [1, 10], baseId: 1008, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 112, upgradeDebris: 30, quality: 'SR', weight: 3, summonDebris: [1, 15], baseId: 1009, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 113, upgradeDebris: 30, quality: 'SR', weight: 2, summonDebris: [1, 15], baseId: 1010, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 114, upgradeDebris: 30, quality: 'SR', weight: 2, summonDebris: [1, 15], baseId: 1011, returnRadio: 0.8, lvCost: 100, lvCostRate: 1},
      {type: 1, roleId: 119, upgradeDebris: 50, quality: 'SSR', weight: 1, summonDebris: [1, 10], baseId: 1025, returnRadio: 0.8, lvCost: 50, lvCostRate: 1},
      {type: 1, roleId: 120, upgradeDebris: 50, quality: 'SSR', weight: 1, summonDebris: [1, 10], baseId: 1026, returnRadio: 0.8, lvCost: 50, lvCostRate: 1},

      {type: 2, roleId: 121, upgradeDebris: 10, quality: 'R', weight: 30, summonDebris: [1, 10], baseId: 1027, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 122, upgradeDebris: 10, quality: 'R', weight: 32, summonDebris: [1, 10], baseId: 1028, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 123, upgradeDebris: 30, quality: 'SR', weight: 14, summonDebris: [1, 15], baseId: 1029, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 124, upgradeDebris: 30, quality: 'SR', weight: 13, summonDebris: [1, 15], baseId: 1030, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 115, upgradeDebris: 50, quality: 'SSR', weight: 4, summonDebris: [1, 10], baseId: 1012, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 116, upgradeDebris: 50, quality: 'SSR', weight: 5, summonDebris: [1, 10], baseId: 1013, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 117, upgradeDebris: 80, quality: 'UR', weight: 1, summonDebris: [1, 5], baseId: 1014, returnRadio: 0.8, lvCost: 100, lvCostRate: 2},
      {type: 2, roleId: 118, upgradeDebris: 80, quality: 'UR', weight: 1, summonDebris: [1, 5], baseId: 1015, returnRadio: 0.8, lvCost: 100, lvCostRate: 2}
    ];

    BlockRoleBase.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入召唤配置
  @addApi()
  async saveRoleSummonData() {
    const result = await BlockRoleSummon.find();

    if (result.length) {
      await BlockRoleSummon.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {name: "士兵普通召唤", summonType: 1, roleType: 1, todayFreeCount: 1, coolingTime: 1, consumeAmountOne: 1000,
        consumeAmountTen: 9000, currencyType: 1, summonLevel: ['N', 'R', 'SR'], summonHignCount: 20, summonHignLevel: "SR"},
      {name: "士兵高级召唤", summonType: 2, roleType: 1, todayFreeCount: 1, coolingTime: 1, consumeAmountOne: 150,
        consumeAmountTen: 1350, currencyType: 2, summonLevel: ['R', 'SR', 'SSR'], summonHignCount: 50, summonHignLevel: "SSR"},
      {name: "英雄普通召唤", summonType: 1, roleType: 2, todayFreeCount: 1, coolingTime: 1, consumeAmountOne: 1500,
        consumeAmountTen: 13500, currencyType: 1, summonLevel: ['R', 'SR', 'SSR'], summonHignCount: 50, summonHignLevel: "SSR"},
      {name: "英雄高级召唤", summonType: 2, roleType: 2, todayFreeCount: 1, coolingTime: 1, consumeAmountOne: 200,
        consumeAmountTen: 1800, currencyType: 2, summonLevel: ['SSR', 'SR', 'UR'], summonHignCount: 80, summonHignLevel: "UR"},
    ];

    BlockRoleSummon.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入任务数据
  @addApi()
  async saveTaskData() {
    const result = await BlockTask.find();

    if (result.length) {
      await BlockTask.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {taskName: "登录游戏", taskType: 1, taskId: 1001, taskTimes: 1, liveness: 10, prizeList: [
          {name: "50金币", number: 50, level: 1, type: 0, propId: 103}
        ]
      },
      {taskName: "商城购买礼包1次", taskType: 1, taskId: 1002, taskTimes: 1, liveness: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "购买体力1次", taskType: 1, taskId: 1003, taskTimes: 1, liveness: 10, prizeList: [
          {name: "5体力", number: 5, level: 1, type: 2, propId: 101}
        ]
      },
      {taskName: "累计消除10行方块", taskType: 1, taskId: 1004, taskTimes: 10, liveness: 15, prizeList: [
          {name: "50金币", number: 50, level: 1, type: 0, propId: 103}
        ]
      },
      {taskName: "消灭敌人30个", taskType: 1, taskId: 1005, taskTimes: 30, liveness: 15, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "召唤1次", taskType: 1, taskId: 1006, taskTimes: 1, liveness: 10, prizeList: [
          {name: "50金币", number: 50, level: 1, type: 0, propId: 103}
        ]
      },
      {taskName: "士兵升级1次", taskType: 1, taskId: 1007, taskTimes: 1, liveness: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级1次", taskType: 1, taskId: 1008, taskTimes: 1, liveness: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告3次", taskType: 1, taskId: 1009, taskTimes: 3, liveness: 15, prizeList: [
          {name: "50金币", number: 50, level: 1, type: 0, propId: 103}
        ]
      },
      {taskName: "参与关卡1次", taskType: 1, taskId: 1010, taskTimes: 1, liveness: 10, prizeList: [
          {name: "5体力", number: 5, level: 1, type: 2, propId: 101}
        ]
      },
      {taskName: "完成所有任务", taskType: 1, taskId: 1011, taskTimes: 10, liveness: 15, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计登录3天", taskType: 2, taskId: 2001, taskTimes: 3, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计登录5天", taskType: 2, taskId: 2002, taskTimes: 5, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计登录7天", taskType: 2, taskId: 2003, taskTimes: 7, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计登录14天", taskType: 2, taskId: 2004, taskTimes: 14, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计登录30天", taskType: 2, taskId: 2005, taskTimes: 30, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁1个士兵", taskType: 2, taskId: 2006, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁2个士兵", taskType: 2, taskId: 2007, taskTimes: 2, prizeList: [
          {name: "5个钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁3个士兵", taskType: 2, taskId: 2008, taskTimes: 3, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁4个士兵", taskType: 2, taskId: 2009, taskTimes: 4, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁5个士兵", taskType: 2, taskId: 2010, taskTimes: 5, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁6个士兵", taskType: 2, taskId: 2011, taskTimes: 6, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁7个士兵", taskType: 2, taskId: 2012, taskTimes: 7, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁8个士兵", taskType: 2, taskId: 2013, taskTimes: 8, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁9个士兵", taskType: 2, taskId: 2014, taskTimes: 9, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁10个士兵", taskType: 2, taskId: 2015, taskTimes: 10, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁1个英雄", taskType: 2, taskId: 2016, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁2个英雄", taskType: 2, taskId: 2017, taskTimes: 2, prizeList: [
          {name: "5个钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁3个英雄", taskType: 2, taskId: 2018, taskTimes: 3, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁4个英雄", taskType: 2, taskId: 2019, taskTimes: 4, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁5个英雄", taskType: 2, taskId: 2020, taskTimes: 5, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁6个英雄", taskType: 2, taskId: 2021, taskTimes: 6, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁7个英雄", taskType: 2, taskId: 2022, taskTimes: 7, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁8个英雄", taskType: 2, taskId: 2023, taskTimes: 8, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁9个英雄", taskType: 2, taskId: 2024, taskTimes: 9, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "解锁10个英雄", taskType: 2, taskId: 2025, taskTimes: 10, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第1关卡", taskType: 2, taskId: 2026, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第2关卡", taskType: 2, taskId: 2027, taskTimes: 2, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第3关卡", taskType: 2, taskId: 2028, taskTimes: 3, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第4关卡", taskType: 2, taskId: 2029, taskTimes: 4, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第5关卡", taskType: 2, taskId: 2030, taskTimes: 5, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第6关卡", taskType: 2, taskId: 2031, taskTimes: 6, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第7关卡", taskType: 2, taskId: 2032, taskTimes: 7, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第8关卡", taskType: 2, taskId: 2033, taskTimes: 8, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第9关卡", taskType: 2, taskId: 2034, taskTimes: 9, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第10关卡", taskType: 2, taskId: 2035, taskTimes: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第11关卡", taskType: 2, taskId: 2036, taskTimes: 11, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第12关卡", taskType: 2, taskId: 2037, taskTimes: 12, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第13关卡", taskType: 2, taskId: 2038, taskTimes: 13, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第14关卡", taskType: 2, taskId: 2039, taskTimes: 14, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第15关卡", taskType: 2, taskId: 2040, taskTimes: 15, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第16关卡", taskType: 2, taskId: 2041, taskTimes: 16, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第17关卡", taskType: 2, taskId: 2042, taskTimes: 17, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第18关卡", taskType: 2, taskId: 2043, taskTimes: 18, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第19关卡", taskType: 2, taskId: 2044, taskTimes: 19, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第20关卡", taskType: 2, taskId: 2045, taskTimes: 20, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第21关卡", taskType: 2, taskId: 2046, taskTimes: 21, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第22关卡", taskType: 2, taskId: 2047, taskTimes: 22, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第23关卡", taskType: 2, taskId: 2048, taskTimes: 23, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第24关卡", taskType: 2, taskId: 2049, taskTimes: 24, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第25关卡", taskType: 2, taskId: 2050, taskTimes: 25, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第26关卡", taskType: 2, taskId: 2051, taskTimes: 26, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第27关卡", taskType: 2, taskId: 2052, taskTimes: 27, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第28关卡", taskType: 2, taskId: 2053, taskTimes: 28, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第29关卡", taskType: 2, taskId: 2054, taskTimes: 29, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "通关第30关卡", taskType: 2, taskId: 2055, taskTimes: 30, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤1次", taskType: 2, taskId: 2056, taskTimes: 1, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤10次", taskType: 2, taskId: 2057, taskTimes: 10, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤30次", taskType: 2, taskId: 2058, taskTimes: 30, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤1次", taskType: 2, taskId: 2056, taskTimes: 1, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤10次", taskType: 2, taskId: 2057, taskTimes: 10, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤30次", taskType: 2, taskId: 2058, taskTimes: 30, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤50次", taskType: 2, taskId: 2059, taskTimes: 50, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤80次", taskType: 2, taskId: 2060, taskTimes: 80, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤100次", taskType: 2, taskId: 2061, taskTimes: 100, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤500次", taskType: 2, taskId: 2062, taskTimes: 500, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤1000次", taskType: 2, taskId: 2063, taskTimes: 1000, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤5000次", taskType: 2, taskId: 2064, taskTimes: 5000, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计召唤20000次", taskType: 2, taskId: 2065, taskTimes: 20000, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升级1次", taskType: 2, taskId: 2066, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升级5次", taskType: 2, taskId: 2067, taskTimes: 5, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升级10次", taskType: 2, taskId: 2068, taskTimes: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升级50次", taskType: 2, taskId: 2069, taskTimes: 50, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升级100次", taskType: 2, taskId: 2070, taskTimes: 100, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升阶1次", taskType: 2, taskId: 2071, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升阶5次", taskType: 2, taskId: 2072, taskTimes: 5, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升阶10次", taskType: 2, taskId: 2073, taskTimes: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升阶50次", taskType: 2, taskId: 2074, taskTimes: 50, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "士兵升阶100次", taskType: 2, taskId: 2075, taskTimes: 100, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级1次", taskType: 2, taskId: 2076, taskTimes: 1, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级5次", taskType: 2, taskId: 2077, taskTimes: 5, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级10次", taskType: 2, taskId: 2078, taskTimes: 10, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级50次", taskType: 2, taskId: 2079, taskTimes: 50, prizeList: [
          {name: "15钻石", number: 15, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升级100次", taskType: 2, taskId: 2080, taskTimes: 100, prizeList: [
          {name: "20钻石", number: 20, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升阶1次", taskType: 2, taskId: 2081, taskTimes: 1, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升阶5次", taskType: 2, taskId: 2082, taskTimes: 5, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升阶10次", taskType: 2, taskId: 2083, taskTimes: 10, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升阶50次", taskType: 2, taskId: 2084, taskTimes: 50, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "英雄升阶100次", taskType: 2, taskId: 2085, taskTimes: 100, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人50个", taskType: 2, taskId: 2086, taskTimes: 50, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人100个", taskType: 2, taskId: 2087, taskTimes: 100, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人300个", taskType: 2, taskId: 2088, taskTimes: 300, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人800个", taskType: 2, taskId: 2089, taskTimes: 800, prizeList: [
          {name: "5钻石", number: 5, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人1000个", taskType: 2, taskId: 2090, taskTimes: 1000, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人5000个", taskType: 2, taskId: 2091, taskTimes: 5000, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人10000个", taskType: 2, taskId: 2092, taskTimes: 10000, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "累计消灭敌人50000个", taskType: 2, taskId: 2093, taskTimes: 50000, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告10次", taskType: 2, taskId: 2094, taskTimes: 10, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告20次", taskType: 2, taskId: 2095, taskTimes: 20, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告50次", taskType: 2, taskId: 2096, taskTimes: 50, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告100次", taskType: 2, taskId: 2097, taskTimes: 100, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告300次", taskType: 2, taskId: 2098, taskTimes: 300, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告500次", taskType: 2, taskId: 2099, taskTimes: 500, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告1000次", taskType: 2, taskId: 2100, taskTimes: 1000, prizeList: [
          {name: "10钻石", number: 10, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告5000次", taskType: 2, taskId: 2101, taskTimes: 5000, prizeList: [
          {name: "25钻石", number: 25, level: 1, type: 1, propId: 102}
        ]
      },
      {taskName: "观看广告10000次", taskType: 2, taskId: 2102, taskTimes: 10000, prizeList: [
          {name: "25钻石", number: 25, level: 1, type: 1, propId: 102}
        ]
      },
    ];

    BlockTask.insertMany(datas);

    const result1 = await BlockTaskTotalPrize.find();

    if (result1.length) {
      await BlockTaskTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {name: "10个体力", number: 5, level: 1, type: 2, propId: 101, liveness: 20},
      {name: "200个金币", number: 200, level: 1, type: 0, propId: 103, liveness: 40},
      {name: "20个钻石", number: 20, level: 1, type: 1, propId: 102, liveness: 60},
      {name: "300个金币", number: 300, level: 1, type: 0, propId: 103, liveness: 80},
      {name: "英灵神箭手碎片*1", number: 1, level: 1, type: 3, propId: 110, liveness: 100}
    ];

    BlockTaskTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入七日狂欢数据
  @addApi()
  async saveSevenTaskData() {
    const result = await BlockSevenTask.find();

    if (result.length) {
      await BlockSevenTask.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {taskType: 2, taskId: 1001, taskTimes: 1, day: 1, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1002, taskTimes: 66, day: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1003, taskTimes: 2, day: 2, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1004, taskTimes: 99, day: 2, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1005, taskTimes: 3, day: 3, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1006, taskTimes: 158, day: 3, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1007, taskTimes: 4, day: 4, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1008, taskTimes: 198, day: 4, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1009, taskTimes: 5, day: 5, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1010, taskTimes: 258, day: 5, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1011, taskTimes: 6, day: 6, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1012, taskTimes: 298, day: 6, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 2, taskId: 1013, taskTimes: 7, day: 7, prizeList: [
          {number: 500, type: 1, propId: 102},
        ]
      },
      {taskType: 1, taskId: 1014, taskTimes: 398, day: 7, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType: 5, taskId: 1015, taskTimes: 2, day: 1, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1016, taskTimes: 4, day: 1, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1017, taskTimes: 6, day: 1, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1018, taskTimes: 8, day: 1, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1019, taskTimes: 10, day: 2, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1020, taskTimes: 12, day: 2, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1021, taskTimes: 14, day: 2, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1022, taskTimes: 16, day: 2, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1023, taskTimes: 17, day: 3, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1024, taskTimes: 18, day: 3, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1025, taskTimes: 20, day: 3, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1026, taskTimes: 22, day: 3, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1027, taskTimes: 23, day: 4, prizeList: [
          {umber: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1028, taskTimes: 24, day: 4, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1029, taskTimes: 25, day: 4, prizeList: [
          {umber: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1030, taskTimes: 26, day: 4, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1031, taskTimes: 27, day: 5, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1032, taskTimes: 28, day: 5, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1033, taskTimes: 29, day: 5, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1034, taskTimes: 30, day: 5, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1035, taskTimes: 31, day: 6, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1036, taskTimes: 32, day: 6, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1037, taskTimes: 33, day: 6, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1038, taskTimes: 34, day: 6, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1039, taskTimes: 35, day: 7, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1040, taskTimes: 36, day: 7, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1041, taskTimes: 37, day: 7, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType: 5, taskId: 1042, taskTimes: 38, day: 7, prizeList: [
          {number: 200, type: 1, propId: 102}
        ]
      },
      {taskType : 6, taskId: 1043, taskTimes: 1, day: 1, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1044, taskTimes: 1, day: 1, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1045, taskTimes: 1, day: 2, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1046, taskTimes: 1, day: 2, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1047, taskTimes: 1, day: 3, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1048, taskTimes: 1, day: 3, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1049, taskTimes: 1, day: 4, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1050, taskTimes: 1, day: 4, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1051, taskTimes: 1, day: 5, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1052, taskTimes: 1, day: 5, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1053, taskTimes: 1, day: 6, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1054, taskTimes: 1, day: 6, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
      {taskType : 6, taskId: 1055, taskTimes: 1, day: 7, originalCost: 300, currentCost: 180, payCount: 1, prizeList: [
          {number: 5, type: 3, propId: 112}
        ]
      },
      {taskType : 6, taskId: 1056, taskTimes: 1, day: 7, originalCost: 150, currentCost: 50, payCount: 1, prizeList: [
          {number: 2000, type: 2, propId: 103}
        ]
      },
    ];

    await BlockSevenTask.insertMany(datas);

    const result1 = await BlockSevenTaskTotalPrize.find();

    if (result1.length) {
      await BlockSevenTaskTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {number: 2000, level: 1, type: 2, propId: 103, liveness: 8},
      {number: 100, level: 1, type: 1, propId: 102, liveness: 16},
      {number: 10, level: 1, type: 3, propId: 116, liveness: 24},
      {number: 15, level: 1, type: 3, propId: 116, liveness: 32},
      {number: 25, level: 1, type: 3, propId: 116, liveness: 40},
    ];

    BlockSevenTaskTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入在线奖励数据
  @addApi()
  async saveOnlinePrizeData() {
    const result = await BlockPrize.find();

    if (result.length) {
      await BlockPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {type: 1, number: 100, level: 1, propId: 102, times: 300},
      {type: 2, number: 500, level: 2, propId: 103, times: 600},
      {type: 4, number: 5, level: 3, propId: 101, times: 1200},
      {type: 3, number: 10, level: 1, propId: 109, times: 1800},
      {type: 1, number: 100, level: 2, propId: 102, times: 3000},
      {type: 2, number: 500, level: 3, propId: 103, times: 3600},
      {type: 4, number: 10, level: 1, propId: 101, times: 7200},
      {type: 3, number: 30, level: 2, propId: 112, times: 9000},
      {type: 1, number: 200, level: 3, propId: 102, times: 10800},
      {type: 2, number: 1000, level: 1, propId: 103, times: 12800},
      {type: 4, number: 15, level: 2, propId: 101, times: 15800},
      {type: 3, number: 30, level: 3, propId: 113, times: 21800},
      {type: 1, number: 300, level: 1, propId: 102, times: 25800},
      {type: 2, number: 2000, level: 2, propId: 103, times: 31800},
      {type: 4, number: 20, level: 3, propId: 101, times: 36800},
      {type: 6, number: 30, level: 2, propId: 124, times: 41800},
    ];

    await BlockPrize.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 增加7日登录测试数据
  @addApi()
  async sevenSignLists() {
    const result = await BlockSevenSignPrize.find();

    if (result.length) {
      await BlockSevenSignPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {type: 3, number: 10, propId: 121, day: 1},
      {type: 1, number: 2000, propId: 102, day: 2},
      {type: 3, number: 50, propId: 119, day: 3},
      {type: 1, number: 2000, propId: 102, day: 4},
      {type: 2, number: 20000, propId: 103, day: 5},
      {type: 1, number: 4000, propId: 102, day: 6},
      {type: 3, number: 50, propId: 115, day: 7},

    ];

    await BlockSevenSignPrize.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 增加商城等级数据
  @addApi()
  async saveShopLevelLists() {
    const result = await BlockShopGiftLevel.find();

    if (result.length) {
      await BlockShopGiftLevel.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {level: 1, empirical: 0},
      {level: 2, empirical: 300},
      {level: 3, empirical: 800},
      {level: 4, empirical: 1500},
      {level: 5, empirical: 2100},
      {level: 6, empirical: 3200},
      {level: 7, empirical: 4800},
      {level: 8, empirical: 6400},
      {level: 9, empirical: 7200},
      {level: 10, empirical: 9000}

    ];

    await BlockShopGiftLevel.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 增加波数测试数据
  @addApi()
  async saveWaveNumberLists() {
    const result = await BlockWaveNumber.find();

    if (result.length) {
      await BlockWaveNumber.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {waveId: 10000, name: "引导波数", enemyId: [{enemyId: 1031, number: 5}], enemyLv: [{enemyId: 1031, level: 1}], timeGap: 6, prizeLists: [{type: 0, number: 100, propId: 103}, {type: 3, number: 5, propId: 105}]},
      {waveId: 10001, name: "波数1",  enemyId: [{enemyId: 1016, number: 5}], enemyLv: [{enemyId: 1016, level: 1}],  timeGap: 4, prizeLists: [{type: 0, number: 20, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10002, name: "波数2",  enemyId: [{enemyId: 1016, number: 5}], enemyLv: [{enemyId: 1016, level: 2}],  timeGap: 4, prizeLists: [{type: 0, number: 50, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10003, name: "波数3",  enemyId: [{enemyId: 1017, number: 5}], enemyLv: [{enemyId: 1017, level: 3}],  timeGap: 4, prizeLists: [{type: 0, number: 100, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10004, name: "波数4",  enemyId: [{enemyId: 1017, number: 8}], enemyLv: [{enemyId: 1017, level: 4}],  timeGap: 4, prizeLists: [{type: 0, number: 150, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10005, name: "波数5",  enemyId: [{enemyId: 1018, number: 8}], enemyLv: [{enemyId: 1018, level: 6}],  timeGap: 4, prizeLists: [{type: 0, number: 200, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10006, name: "波数6",  enemyId: [{enemyId: 1016, number: 8}], enemyLv: [{enemyId: 1016, level: 7}],  timeGap: 3, prizeLists: [{type: 0, number: 250, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10007, name: "波数7",  enemyId: [{enemyId: 1017, number: 10}], enemyLv: [{enemyId: 1017, level: 8}],  timeGap: 3, prizeLists: [{type: 0, number: 300, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10008, name: "波数8",  enemyId: [{enemyId: 1016, number: 10}], enemyLv: [{enemyId: 1016, level: 9}],  timeGap: 3, prizeLists: [{type: 0, number: 350, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10009, name: "波数9",  enemyId: [{enemyId: 1017, number: 10}], enemyLv: [{enemyId: 1017, level: 10}],  timeGap: 3, prizeLists: [{type: 0, number: 400, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10010, name: "波数10", enemyId: [{enemyId: 1019, number: 10}], enemyLv: [{enemyId: 1019, level: 12}], timeGap: 3, prizeLists: [{type: 0, number: 450, propId: 103}, {type: 1, number: 10, propId: 102}]},
      {waveId: 10011, name: "波数11", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 13}], timeGap: 3, prizeLists: [{type: 0, number: 500, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10012, name: "波数12", enemyId: [{enemyId: 1017, number: 12}], enemyLv: [{enemyId: 1017, level: 14}], timeGap: 3, prizeLists: [{type: 0, number: 500, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10013, name: "波数13", enemyId: [{enemyId: 1017, number: 12}], enemyLv: [{enemyId: 1017, level: 15}], timeGap: 3, prizeLists: [{type: 0, number: 500, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10014, name: "波数14", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 16}], timeGap: 3, prizeLists: [{type: 0, number: 550, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10015, name: "波数15", enemyId: [{enemyId: 1018, number: 12}], enemyLv: [{enemyId: 1018, level: 20}], timeGap: 3, prizeLists: [{type: 0, number: 550, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10016, name: "波数16", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 21}], timeGap: 3, prizeLists: [{type: 0, number: 600, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10017, name: "波数17", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 22}], timeGap: 3, prizeLists: [{type: 0, number: 600, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10018, name: "波数18", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 23}], timeGap: 3, prizeLists: [{type: 0, number: 600, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10019, name: "波数19", enemyId: [{enemyId: 1017, number: 12}], enemyLv: [{enemyId: 1017, level: 24}], timeGap: 3, prizeLists: [{type: 0, number: 650, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10020, name: "波数20", enemyId: [{enemyId: 1020, number: 12}], enemyLv: [{enemyId: 1020, level: 30}], timeGap: 3, prizeLists: [{type: 0, number: 650, propId: 103}, {type: 1, number: 20, propId: 102}]},
      {waveId: 10021, name: "波数21", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 31}], timeGap: 3, prizeLists: [{type: 0, number: 650, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10022, name: "波数22", enemyId: [{enemyId: 1017, number: 12}], enemyLv: [{enemyId: 1017, level: 32}], timeGap: 3, prizeLists: [{type: 0, number: 700, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10023, name: "波数23", enemyId: [{enemyId: 1017, number: 12}], enemyLv: [{enemyId: 1017, level: 33}], timeGap: 3, prizeLists: [{type: 0, number: 700, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10024, name: "波数24", enemyId: [{enemyId: 1016, number: 12}], enemyLv: [{enemyId: 1016, level: 34}], timeGap: 3, prizeLists: [{type: 0, number: 700, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10025, name: "波数25", enemyId: [{enemyId: 1018, number: 12}], enemyLv: [{enemyId: 1018, level: 38}], timeGap: 3, prizeLists: [{type: 0, number: 750, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10026, name: "波数26", enemyId: [{enemyId: 1016, number: 14}], enemyLv: [{enemyId: 1016, level: 41}], timeGap: 3, prizeLists: [{type: 0, number: 750, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10027, name: "波数27", enemyId: [{enemyId: 1017, number: 14}], enemyLv: [{enemyId: 1017, level: 42}], timeGap: 3, prizeLists: [{type: 0, number: 750, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10028, name: "波数28", enemyId: [{enemyId: 1018, number: 14}], enemyLv: [{enemyId: 1018, level: 43}], timeGap: 3, prizeLists: [{type: 0, number: 800, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10029, name: "波数29", enemyId: [{enemyId: 1019, number: 14}], enemyLv: [{enemyId: 1019, level: 44}], timeGap: 2, prizeLists: [{type: 0, number: 800, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10030, name: "波数30", enemyId: [{enemyId: 1020, number: 14}], enemyLv: [{enemyId: 1020, level: 46}], timeGap: 2, prizeLists: [{type: 0, number: 800, propId: 103}, {type: 1, number: 30, propId: 102}]},
      {waveId: 10031, name: "波数31", enemyId: [{enemyId: 1016, number: 14}], enemyLv: [{enemyId: 1016, level: 47}], timeGap: 3, prizeLists: [{type: 0, number: 850, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10032, name: "波数32", enemyId: [{enemyId: 1017, number: 14}], enemyLv: [{enemyId: 1017, level: 48}], timeGap: 3, prizeLists: [{type: 0, number: 850, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10033, name: "波数33", enemyId: [{enemyId: 1018, number: 14}], enemyLv: [{enemyId: 1018, level: 49}], timeGap: 3, prizeLists: [{type: 0, number: 850, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10034, name: "波数34", enemyId: [{enemyId: 1019, number: 14}], enemyLv: [{enemyId: 1019, level: 50}], timeGap: 3, prizeLists: [{type: 0, number: 900, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10035, name: "波数35", enemyId: [{enemyId: 1020, number: 14}], enemyLv: [{enemyId: 1020, level: 51}], timeGap: 3, prizeLists: [{type: 0, number: 900, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10036, name: "波数36", enemyId: [{enemyId: 1016, number: 14}], enemyLv: [{enemyId: 1016, level: 52}], timeGap: 3, prizeLists: [{type: 0, number: 900, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10037, name: "波数37", enemyId: [{enemyId: 1017, number: 14}], enemyLv: [{enemyId: 1017, level: 54}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10038, name: "波数38", enemyId: [{enemyId: 1018, number: 14}], enemyLv: [{enemyId: 1018, level: 56}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10039, name: "波数39", enemyId: [{enemyId: 1019, number: 14}], enemyLv: [{enemyId: 1019, level: 58}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10040, name: "波数40", enemyId: [{enemyId: 1020, number: 14}], enemyLv: [{enemyId: 1020, level: 60}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 40, propId: 102}]},
      {waveId: 10041, name: "波数41", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10042, name: "波数42", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10043, name: "波数43", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10044, name: "波数44", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10045, name: "波数45", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10046, name: "波数46", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10047, name: "波数47", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10048, name: "波数48", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10049, name: "波数49", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10050, name: "波数50", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10051, name: "波数51", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10052, name: "波数52", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10053, name: "波数53", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10054, name: "波数54", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10055, name: "波数55", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10056, name: "波数56", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10057, name: "波数57", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10058, name: "波数58", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10059, name: "波数59", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10060, name: "波数60", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10061, name: "波数61", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10062, name: "波数62", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10063, name: "波数63", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10064, name: "波数64", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10065, name: "波数65", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10066, name: "波数66", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10067, name: "波数67", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10068, name: "波数68", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10069, name: "波数69", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10070, name: "波数70", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10071, name: "波数71", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10072, name: "波数72", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10073, name: "波数73", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10074, name: "波数74", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10075, name: "波数75", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10076, name: "波数76", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10077, name: "波数77", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10078, name: "波数78", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10079, name: "波数79", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10080, name: "波数80", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10081, name: "波数81", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10082, name: "波数82", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10083, name: "波数83", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10084, name: "波数84", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10085, name: "波数85", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10086, name: "波数86", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10087, name: "波数87", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10088, name: "波数88", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10089, name: "波数89", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10090, name: "波数90", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 50, propId: 102}]},
      {waveId: 10091, name: "波数91", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 64}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10092, name: "波数92", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 68}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10093, name: "波数93", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 72}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10094, name: "波数94", enemyId: [{enemyId: 1019, number: 16}], enemyLv: [{enemyId: 1019, level: 76}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10095, name: "波数95", enemyId: [{enemyId: 1020, number: 16}], enemyLv: [{enemyId: 1020, level: 80}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10096, name: "波数96", enemyId: [{enemyId: 1016, number: 16}], enemyLv: [{enemyId: 1016, level: 84}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10097, name: "波数97", enemyId: [{enemyId: 1017, number: 16}], enemyLv: [{enemyId: 1017, level: 88}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10098, name: "波数98", enemyId: [{enemyId: 1018, number: 16}], enemyLv: [{enemyId: 1018, level: 92}], timeGap: 3, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10099, name: "波数99", enemyId: [{enemyId: 1019, number: 18}], enemyLv: [{enemyId: 1019, level: 188}], timeGap: 2, prizeLists: [{type: 0, number: 1000, propId: 103}, {type: 1, number: 150, propId: 102}]},
      {waveId: 10100, name: "波数100", enemyId: [{enemyId: 1020, number: 20}], enemyLv: [{enemyId: 1020, level: 198}], timeGap: 2, prizeLists: [{type: 0, number: 2000, propId: 103}, {type: 1, number: 200, propId: 102}]},
    ];

    await BlockWaveNumber.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 增加关卡测试数据
  @addApi()
  async saveCurLevelLists() {
    const result = await BlockCurLevel.find();

    if (result.length) {
      await BlockCurLevel.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {mapId: 1000, number: "0-1", cashs: []},
      {mapId: 1001, number: "1-1",  cashs: [1, 6]},
      {mapId: 1002, number: "1-2",  cashs: [1, 6]},
      {mapId: 1003, number: "1-3",  cashs: [1, 6]},
      {mapId: 1004, number: "1-4",  cashs: [1, 6]},
      {mapId: 1005, number: "1-5",  cashs: [1, 6]},
      {mapId: 1006, number: "1-6",  cashs: [1, 6]},
      {mapId: 1007, number: "1-7",  cashs: [1, 6]},
      {mapId: 1008, number: "1-8",  cashs: [1, 6]},
      {mapId: 1009, number: "1-9",  cashs: [1, 6]},
      {mapId: 1010, number: "1-10", cashs: [1, 6]},
      {mapId: 1011, number: "2-1", cashs: [1, 6]},
      {mapId: 1012, number: "2-2", cashs: [1, 6]},
      {mapId: 1013, number: "2-3", cashs: [1, 6]},
      {mapId: 1014, number: "2-4", cashs: [1, 6]},
      {mapId: 1015, number: "2-5", cashs: [1, 6]},
      {mapId: 1016, number: "2-6", cashs: [1, 6]},
      {mapId: 1017, number: "2-7", cashs: [1, 6]},
      {mapId: 1018, number: "2-8", cashs: [1, 6]},
      {mapId: 1019, number: "2-9", cashs: [1, 6]},
      {mapId: 1020, number: "2-10", cashs: [1, 6]},
      {mapId: 1021, number: "3-1", cashs: [1, 6]},
      {mapId: 1022, number: "3-2", cashs: [1, 6]},
      {mapId: 1023, number: "3-3", cashs: [1, 6]},
      {mapId: 1024, number: "3-4", cashs: [1, 6]},
      {mapId: 1025, number: "3-5", cashs: [1, 6]},
      {mapId: 1026, number: "3-6", cashs: [1, 6]},
      {mapId: 1027, number: "3-7", cashs: [1, 6]},
      {mapId: 1028, number: "3-8", cashs: [1, 6]},
      {mapId: 1029, number: "3-9", cashs: [1, 6]},
      {mapId: 1030, number: "3-10", cashs: [1, 6]},
      {mapId: 1031, number: "4-1", cashs: [1, 6]},
      {mapId: 1032, number: "4-2", cashs: [1, 6]},
      {mapId: 1033, number: "4-3", cashs: [1, 6]},
      {mapId: 1034, number: "4-4", cashs: [1, 6]},
      {mapId: 1035, number: "4-5", cashs: [1, 6]},
      {mapId: 1036, number: "4-6", cashs: [1, 6]},
      {mapId: 1037, number: "4-7", cashs: [1, 6]},
      {mapId: 1038, number: "4-8", cashs: [1, 6]},
      {mapId: 1039, number: "4-9", cashs: [1, 6]},
      {mapId: 1040, number: "4-10", cashs: [1, 6]},
      {mapId: 1041, number: "5-1", cashs: [1, 6]},
      {mapId: 1042, number: "5-2", cashs: [1, 6]},
      {mapId: 1043, number: "5-3", cashs: [1, 6]},
      {mapId: 1044, number: "5-4", cashs: [1, 6]},
      {mapId: 1045, number: "5-5", cashs: [1, 6]},
      {mapId: 1046, number: "5-6", cashs: [1, 6]},
      {mapId: 1047, number: "5-7", cashs: [1, 6]},
      {mapId: 1048, number: "5-8", cashs: [1, 6]},
      {mapId: 1049, number: "5-9", cashs: [1, 6]},
      {mapId: 1050, number: "5-10", cashs: [1, 6]},
      {mapId: 1051, number: "6-1", cashs: [1, 6]},
      {mapId: 1052, number: "6-2", cashs: [1, 6]},
      {mapId: 1053, number: "6-3", cashs: [1, 6]},
      {mapId: 1054, number: "6-4", cashs: [1, 6]},
      {mapId: 1055, number: "6-5", cashs: [1, 6]},
      {mapId: 1056, number: "6-6", cashs: [1, 6]},
      {mapId: 1057, number: "6-7", cashs: [1, 6]},
      {mapId: 1058, number: "6-8", cashs: [1, 6]},
      {mapId: 1059, number: "6-9", cashs: [1, 6]},
      {mapId: 1060, number: "6-10", cashs: [1, 6]},
      {mapId: 1061, number: "7-1", cashs: [1, 6]},
      {mapId: 1062, number: "7-2", cashs: [1, 6]},
      {mapId: 1063, number: "7-3", cashs: [1, 6]},
      {mapId: 1064, number: "7-4", cashs: [1, 6]},
      {mapId: 1065, number: "7-5", cashs: [1, 6]},
      {mapId: 1066, number: "7-6", cashs: [1, 6]},
      {mapId: 1067, number: "7-7", cashs: [1, 6]},
      {mapId: 1068, number: "7-8", cashs: [1, 6]},
      {mapId: 1069, number: "7-9", cashs: [1, 6]},
      {mapId: 1070, number: "7-10", cashs: [1, 6]},
      {mapId: 1071, number: "8-1", cashs: [1, 6]},
      {mapId: 1072, number: "8-2", cashs: [1, 6]},
      {mapId: 1073, number: "8-3", cashs: [1, 6]},
      {mapId: 1074, number: "8-4", cashs: [1, 6]},
      {mapId: 1075, number: "8-5", cashs: [1, 6]},
      {mapId: 1076, number: "8-6", cashs: [1, 6]},
      {mapId: 1077, number: "8-7", cashs: [1, 6]},
      {mapId: 1078, number: "8-8", cashs: [1, 6]},
      {mapId: 1079, number: "8-9", cashs: [1, 6]},
      {mapId: 1080, number: "8-10", cashs: [1, 6]},
      {mapId: 1081, number: "9-1", cashs: [1, 6]},
      {mapId: 1082, number: "9-2", cashs: [1, 6]},
      {mapId: 1083, number: "9-3", cashs: [1, 6]},
      {mapId: 1084, number: "9-4", cashs: [1, 6]},
      {mapId: 1085, number: "9-5", cashs: [1, 6]},
      {mapId: 1086, number: "9-6", cashs: [1, 6]},
      {mapId: 1087, number: "9-7", cashs: [1, 6]},
      {mapId: 1088, number: "9-8", cashs: [1, 6]},
      {mapId: 1089, number: "9-9", cashs: [1, 6]},
      {mapId: 1090, number: "9-10", cashs: [1, 6]},
      {mapId: 1091, number: "10-1", cashs: [1, 6]},
      {mapId: 1092, number: "10-2", cashs: [1, 6]},
      {mapId: 1093, number: "10-3", cashs: [1, 6]},
      {mapId: 1094, number: "10-4", cashs: [1, 6]},
      {mapId: 1095, number: "10-5", cashs: [1, 6]},
      {mapId: 1096, number: "10-6", cashs: [1, 6]},
      {mapId: 1097, number: "10-7", cashs: [1, 6]},
      {mapId: 1098, number: "10-8", cashs: [1, 6]},
      {mapId: 1099, number: "10-9", cashs: [1, 6]},
      {mapId: 1100, number: "10-10", cashs: [1, 6]},
    ];

    await BlockCurLevel.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 获取头像
  @addApi()
  async getAvatars() {
    const result = await Player.find({"isTourist" : false}).limit(1083).sort({createAt: -1});
    const avatars = [];

    for (let i = 0; i < result.length; i++) {
      avatars.push(result[i].headImgUrl);
    }

    return this.replySuccess(avatars);
  }
}
