import {addApi, BaseApi} from "./baseApi";

import Player from "../../database/models/player";
import TurntablePrize from "../../database/models/turntablePrize";
import SevenSignPrize from "../../database/models/SevenSignPrize";
import HeadBorder from "../../database/models/HeadBorder";
import Medal from "../../database/models/Medal";
import CardTable from "../../database/models/CardTable";
import Task from "../../database/models/task";
import TaskTotalPrize from "../../database/models/TaskTotalPrize";
import Debris from "../../database/models/debris";
import DebrisTotalPrize from "../../database/models/DebrisTotalPrize";
import VipConfig from "../../database/models/VipConfig";
import RegressionSignPrize from "../../database/models/RegressionSignPrize";
import CardType from "../../database/models/CardType";
import GoodsProp from "../../database/models/GoodsProp";
import DailySupplementGift from "../../database/models/DailySupplementGift";
import GoodsReviveTlGold from "../../database/models/goodsReviveTlGold";
import GoodsDailySupplement from "../../database/models/goodsDailySupplement";
import RegressionTask from "../../database/models/regressionTask";
import regressionTaskTotalPrize from "../../database/models/regressionTaskTotalPrize";
import RegressionDiscountGift from "../../database/models/regressionDiscountGift";
import WithdrawConfig from "../../database/models/withdrawConfig";

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

    await TurntablePrize.insertMany(gifts);
    return this.replySuccess(gifts);
  }

  // 增加7日登录测试数据
  @addApi()
  async sevenSignLists() {
    const result = await SevenSignPrize.find();

    if (result.length) {
      await SevenSignPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {diamod: 3, gold: 300000000, day: 1},
      {diamod: 5, gold: 500000000, day: 2},
      {diamod: 8, gold: 1000000000, day: 3},
      {diamod: 10, gold: 2000000000, day: 4},
      {diamod: 15, gold: 5000000000, day: 5},
      {diamod: 20, gold: 10000000000, day: 6},
      {diamod: 30, gold: 28800000000, day: 7},
    ];

    await SevenSignPrize.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 增加回归签到测试数据
  @addApi()
  async regressionSignLists() {
    const result = await RegressionSignPrize.find();

    if (result.length) {
      await RegressionSignPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        freePrizeList: [{type: 1, number: 10}, {type: 2, number: 200000}],
        payPrizeList: [{type: 1, number: 80}, {type: 2, number: 10000000}],
        day: 1
      },
      {
        freePrizeList: [{type: 1, number: 20}, {type: 2, number: 300000}],
        payPrizeList: [{type: 1, number: 100}, {type: 2, number: 40000000}],
        day: 2
      },
      {
        freePrizeList: [{type: 1, number: 30}, {type: 2, number: 600000}],
        payPrizeList: [{type: 1, number: 130}, {type: 2, number: 60000000}],
        day: 3
      },
      {
        freePrizeList: [{type: 1, number: 40}, {type: 2, number: 800000}],
        payPrizeList: [{type: 1, number: 150}, {type: 2, number: 88880000}],
        day: 4
      },
      {
        freePrizeList: [{type: 1, number: 50}, {type: 2, number: 1000000}],
        payPrizeList: [{type: 1, number: 188}, {type: 2, number: 100000000}],
        day: 5
      },
      {
        freePrizeList: [{type: 1, number: 60}, {type: 2, number: 2000000}],
        payPrizeList: [{type: 1, number: 288}, {type: 2, number: 500000000}],
        day: 6
      },
      {
        freePrizeList: [{type: 1, number: 70}, {type: 2, number: 3000000}],
        payPrizeList: [{type: 1, number: 588}, {type: 2, number: 1000000000}],
        day: 7
      },
      {
        freePrizeList: [{type: 1, number: 80}, {type: 2, number: 5000000}], payPrizeList: [
          {type: 1, number: 888},
          {type: 2, number: 1880000000},
          {type: 10, number: 1, propId: 1310},
          {type: 10, number: 1, propId: 1311},
          {type: 10, number: 1, propId: 1312},
          {type: 10, number: 1, propId: 1313},
        ],
        day: 8
      },
    ];

    await RegressionSignPrize.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 获取头像
  @addApi()
  async getAvatars() {
    const result = await Player.find({"isTourist": false}).limit(1083).sort({createAt: -1});
    const avatars = [];

    for (let i = 0; i < result.length; i++) {
      avatars.push(result[i].headImgUrl);
    }

    return this.replySuccess(avatars);
  }

  // 录入任务数据
  @addApi()
  async saveTaskData() {
    const result = await Task.find();

    if (result.length) {
      await Task.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      // 成长成就-富可敌国
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1001,
        taskTimes: 88,
        typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1002,
        taskTimes: 388,
        typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1003,
        taskTimes: 888,
        typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1004,
        taskTimes: 2888,
        typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1005,
        taskTimes: 5888,
        typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },
      {
        taskName: "富可敌国",
        taskDescribe: "拥有钻石数大于?",
        taskType: 1,
        taskId: 1006,
        taskTimes: 8888,
        typeId: 1,
        taskPrizes: {propId: 1122, number: 1, type: 4},
        taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888},
        liveness: 10
      },

      // 成长成就-宴会大亨
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1007,
        taskTimes: 7,
        typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1008,
        taskTimes: 14,
        typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1009,
        taskTimes: 30,
        typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1010,
        taskTimes: 58,
        typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1011,
        taskTimes: 88,
        typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "宴会大亨",
        taskDescribe: "累计签到天数达到?天",
        taskType: 1,
        taskId: 1012,
        taskTimes: 100,
        typeId: 2,
        taskPrizes: {propId: 1118, number: 1, type: 4},
        taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100},
        liveness: 5
      },

      // 成长成就-久经沙场
      {
        taskName: "久经沙场", taskDescribe: "累计对局次数达到?局", taskType: 1, taskId: 1013, taskTimes: 20, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "久经沙场", taskDescribe: "累计对局次数达到?局", taskType: 1, taskId: 1014, taskTimes: 50, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "久经沙场", taskDescribe: "累计对局次数达到?局", taskType: 1, taskId: 1015, taskTimes: 99, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "久经沙场", taskDescribe: "累计对局次数达到?局", taskType: 1, taskId: 1016, taskTimes: 288, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "久经沙场", taskDescribe: "累计对局次数达到?局", taskType: 1, taskId: 1017, taskTimes: 888, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "久经沙场",
        taskDescribe: "累计对局次数达到?局",
        taskType: 1,
        taskId: 1018,
        taskTimes: 1888,
        typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },

      // 成长成就-天道酬勤
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1019,
        taskTimes: 10,
        typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88},
        liveness: 15
      },
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1020,
        taskTimes: 20,
        typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88},
        liveness: 15
      },
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1021,
        taskTimes: 30,
        typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88},
        liveness: 15
      },
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1022,
        taskTimes: 50,
        typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88},
        liveness: 15
      },
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1023,
        taskTimes: 68,
        typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88},
        liveness: 15
      },
      {
        taskName: "天道酬勤",
        taskDescribe: "单日累计对局数达到?局",
        taskType: 1,
        taskId: 1024,
        taskTimes: 88,
        typeId: 4,
        taskPrizes: {propId: 1101, number: 1, type: 4},
        taskDesignates: {title: "天道酬勤", propId: 1118, taskTimes: 88},
        liveness: 15
      },

      // 成长成就-人生赢家
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1025,
        taskTimes: 15000000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1026,
        taskTimes: 30000000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1027,
        taskTimes: 58880000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1028,
        taskTimes: 88880000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1029,
        taskTimes: 500000000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "人生赢家",
        taskDescribe: "游戏豆数量达到?",
        taskType: 1,
        taskId: 1030,
        taskTimes: 2000000000,
        typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2},
        taskDesignates: {},
        liveness: 5
      },

      // 成长成就-收藏家
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1031,
        taskTimes: 1,
        typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 7},
        liveness: 5
      },
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1032,
        taskTimes: 2,
        typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 7},
        liveness: 5
      },
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1033,
        taskTimes: 3,
        typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 7},
        liveness: 5
      },
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1034,
        taskTimes: 4,
        typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 7},
        liveness: 5
      },
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1035,
        taskTimes: 5,
        typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 7},
        liveness: 5
      },
      {
        taskName: "收藏家",
        taskDescribe: "累计拥有永久牌桌?个",
        taskType: 1,
        taskId: 1036,
        taskTimes: 7,
        typeId: 6,
        taskPrizes: {propId: 1103, number: 1, type: 4},
        taskDesignates: {title: "收藏家", propId: 1118, taskTimes: 7},
        liveness: 5
      },

      // 成长成就-颜值担当
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1037,
        taskTimes: 1,
        typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1038,
        taskTimes: 2,
        typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1039,
        taskTimes: 3,
        typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1040,
        taskTimes: 5,
        typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1041,
        taskTimes: 8,
        typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "颜值担当",
        taskDescribe: "累计拥有永久头像框?个",
        taskType: 1,
        taskId: 1042,
        taskTimes: 10,
        typeId: 7,
        taskPrizes: {propId: 1102, number: 1, type: 4},
        taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10},
        liveness: 5
      },

      // 成长成就-贵族气质
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1043, taskTimes: 1, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1044, taskTimes: 2, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1045, taskTimes: 3, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1046, taskTimes: 4, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1047, taskTimes: 5, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },
      {
        taskName: "贵族气质", taskDescribe: "特权等级达到?级", taskType: 1, taskId: 1048, taskTimes: 6, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5
      },

      // 成长成就-弄潮儿
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1049,
        taskTimes: 1,
        typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1050,
        taskTimes: 2,
        typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1051,
        taskTimes: 3,
        typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1052,
        taskTimes: 5,
        typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1053,
        taskTimes: 8,
        typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },
      {
        taskName: "弄潮儿",
        taskDescribe: "累计拥有永久称号?个",
        taskType: 1,
        taskId: 1054,
        taskTimes: 10,
        typeId: 9,
        taskPrizes: {propId: 1126, number: 1, type: 4},
        taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10},
        liveness: 5
      },

      // 对局成就-高处不胜寒
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1055,
        taskTimes: 10,
        typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1056,
        taskTimes: 30,
        typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1057,
        taskTimes: 50,
        typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1058,
        taskTimes: 68,
        typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1059,
        taskTimes: 88,
        typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },
      {
        taskName: "高处不胜寒",
        taskDescribe: "封顶次数（21万倍以上）达到?次",
        taskType: 2,
        taskId: 1060,
        taskTimes: 100,
        typeId: 10,
        taskPrizes: {propId: 1106, number: 1, type: 4},
        taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100},
        liveness: 15
      },

      // 对局成就-嘎嘎乱杀
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1061,
        taskTimes: 10,
        typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1062,
        taskTimes: 30,
        typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1063,
        taskTimes: 50,
        typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1064,
        taskTimes: 68,
        typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1065,
        taskTimes: 88,
        typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "嘎嘎乱杀",
        taskDescribe: "累计?局首次胡牌就清空三个对手",
        taskType: 2,
        taskId: 1066,
        taskTimes: 100,
        typeId: 11,
        taskPrizes: {propId: 1121, number: 1, type: 4},
        taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100},
        liveness: 10
      },

      // 对局成就-禁止划水
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1067,
        taskTimes: 10,
        typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1068,
        taskTimes: 30,
        typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1069,
        taskTimes: 50,
        typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1070,
        taskTimes: 68,
        typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1071,
        taskTimes: 88,
        typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "禁止划水",
        taskDescribe: "累计流局达到?局",
        taskType: 2,
        taskId: 1072,
        taskTimes: 100,
        typeId: 12,
        taskPrizes: {propId: 1120, number: 1, type: 4},
        taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100},
        liveness: 5
      },

      // 对局成就-快枪手
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1073,
        taskTimes: 10,
        typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1074,
        taskTimes: 30,
        typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1075,
        taskTimes: 50,
        typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1076,
        taskTimes: 68,
        typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1077,
        taskTimes: 88,
        typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "快枪手",
        taskDescribe: "累计对局中最先胡牌达到?局",
        taskType: 2,
        taskId: 1078,
        taskTimes: 100,
        typeId: 13,
        taskPrizes: {propId: 1119, number: 1, type: 4},
        taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100},
        liveness: 10
      },

      // 对局成就-疯狂屠夫
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1079,
        taskTimes: 10,
        typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1080,
        taskTimes: 30,
        typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1081,
        taskTimes: 50,
        typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1082,
        taskTimes: 68,
        typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1083,
        taskTimes: 88,
        typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },
      {
        taskName: "疯狂屠夫",
        taskDescribe: "累计使认输人数达到?人",
        taskType: 2,
        taskId: 1084,
        taskTimes: 100,
        typeId: 14,
        taskPrizes: {propId: 1109, number: 1, type: 4},
        taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100},
        liveness: 10
      },

      // 对局成就-回村的诱惑
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1085,
        taskTimes: 10,
        typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1086,
        taskTimes: 30,
        typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1087,
        taskTimes: 50,
        typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1088,
        taskTimes: 68,
        typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1089,
        taskTimes: 88,
        typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "回村的诱惑",
        taskDescribe: "累计对局结束破产次数达到?次",
        taskType: 2,
        taskId: 1090,
        taskTimes: 100,
        typeId: 15,
        taskPrizes: {propId: 1108, number: 1, type: 4},
        taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100},
        liveness: 5
      },

      // 对局成就-决胜千里
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1091,
        taskTimes: 10,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1092,
        taskTimes: 30,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1093,
        taskTimes: 50,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1094,
        taskTimes: 68,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1095,
        taskTimes: 88,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "决胜千里",
        taskDescribe: "累计胜利对局次数达到?局",
        taskType: 2,
        taskId: 1096,
        taskTimes: 100,
        typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },

      // 对局成就-赛诸葛
      {
        taskName: "赛诸葛",
        taskDescribe: "对局连胜达到?局",
        taskType: 2,
        taskId: 1097,
        taskTimes: 15,
        typeId: 17,
        taskPrizes: {propId: 1107, number: 1, type: 4},
        taskDesignates: {title: "赛诸葛", propId: 1107, taskTimes: 15},
        liveness: 15
      },

      // 对局成就-散财童子
      {
        taskName: "散财童子",
        taskDescribe: "对局结算时输豆数量达到?",
        taskType: 2,
        taskId: 1098,
        taskTimes: 99900000000,
        typeId: 18,
        taskPrizes: {propId: 1105, number: 1, type: 4},
        taskDesignates: {title: "散财童子", propId: 1105, taskTimes: 99900000000},
        liveness: 15
      },

      // 对局成就-收割机器
      {
        taskName: "收割机器",
        taskDescribe: "对局结算时赢豆数量达到?",
        taskType: 2,
        taskId: 1099,
        taskTimes: 99900000000,
        typeId: 19,
        taskPrizes: {propId: 1104, number: 1, type: 4},
        taskDesignates: {title: "收割机器", propId: 1104, taskTimes: 99900000000},
        liveness: 15
      },

      // 玩法成就-天选之人
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1100,
        taskTimes: 10,
        typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1101,
        taskTimes: 30,
        typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1102,
        taskTimes: 50,
        typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1103,
        taskTimes: 68,
        typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1104,
        taskTimes: 88,
        typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "天选之人",
        taskDescribe: "累计天胡次数达到?次",
        taskType: 3,
        taskId: 1105,
        taskTimes: 100,
        typeId: 20,
        taskPrizes: {propId: 1115, number: 1, type: 4},
        taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100},
        liveness: 5
      },

      // 玩法成就-潘达守护者
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1106,
        taskTimes: 10,
        typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1107,
        taskTimes: 30,
        typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1108,
        taskTimes: 50,
        typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1109,
        taskTimes: 68,
        typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1110,
        taskTimes: 88,
        typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "潘达守护者",
        taskDescribe: "累计胡四节高达到?次",
        taskType: 3,
        taskId: 1111,
        taskTimes: 100,
        typeId: 21,
        taskPrizes: {propId: 1113, number: 1, type: 4},
        taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100},
        liveness: 5
      },

      // 玩法成就-落地成盒
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1112,
        taskTimes: 10,
        typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1113,
        taskTimes: 30,
        typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1114,
        taskTimes: 50,
        typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1115,
        taskTimes: 68,
        typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1116,
        taskTimes: 88,
        typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "落地成盒",
        taskDescribe: "累计被天胡破产达到?次",
        taskType: 3,
        taskId: 1117,
        taskTimes: 100,
        typeId: 22,
        taskPrizes: {propId: 1112, number: 1, type: 4},
        taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100},
        liveness: 5
      },

      // 玩法成就-春风得意
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1118,
        taskTimes: 10,
        typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1119,
        taskTimes: 30,
        typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1120,
        taskTimes: 50,
        typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1121,
        taskTimes: 68,
        typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1122,
        taskTimes: 88,
        typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "春风得意",
        taskDescribe: "单局摸到6星座牌达到?次",
        taskType: 3,
        taskId: 1123,
        taskTimes: 100,
        typeId: 23,
        taskPrizes: {propId: 1114, number: 1, type: 4},
        taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100},
        liveness: 5
      },

      // 玩法成就-幸运之星
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1124,
        taskTimes: 10,
        typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1125,
        taskTimes: 30,
        typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1126,
        taskTimes: 50,
        typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1127,
        taskTimes: 68,
        typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1128,
        taskTimes: 88,
        typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "幸运之星",
        taskDescribe: "累计杠上开花次数达到?次",
        taskType: 3,
        taskId: 1129,
        taskTimes: 100,
        typeId: 24,
        taskPrizes: {propId: 1111, number: 1, type: 4},
        taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100},
        liveness: 5
      },

      // 玩法成就-人生如梦
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1130,
        taskTimes: 10,
        typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1131,
        taskTimes: 30,
        typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1132,
        taskTimes: 50,
        typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1133,
        taskTimes: 68,
        typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1134,
        taskTimes: 88,
        typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "人生如梦",
        taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?次",
        taskType: 3,
        taskId: 1135,
        taskTimes: 100,
        typeId: 25,
        taskPrizes: {propId: 1110, number: 1, type: 4},
        taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100},
        liveness: 5
      },

      // 特殊成就-财富达人
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1136,
        taskTimes: 10,
        typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1137,
        taskTimes: 30,
        typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1138,
        taskTimes: 50,
        typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1139,
        taskTimes: 68,
        typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1140,
        taskTimes: 88,
        typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },
      {
        taskName: "财富达人",
        taskDescribe: "在商城用钻石兑换金豆达到?次",
        taskType: 4,
        taskId: 1141,
        taskTimes: 100,
        typeId: 26,
        taskPrizes: {propId: 1123, number: 1, type: 4},
        taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100},
        liveness: 5
      },

      // 特殊成就-贵族专业户
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1142,
        taskTimes: 1,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1143,
        taskTimes: 3,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1144,
        taskTimes: 5,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1145,
        taskTimes: 8,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1146,
        taskTimes: 10,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "贵族专业户",
        taskDescribe: "累计购买周卡/月卡达到?次",
        taskType: 4,
        taskId: 1147,
        taskTimes: 20,
        typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },

      // 特殊成就-豪气冲天
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1148,
        taskTimes: 1,
        typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1149,
        taskTimes: 3,
        typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1150,
        taskTimes: 5,
        typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1151,
        taskTimes: 8,
        typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1152,
        taskTimes: 10,
        typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },
      {
        taskName: "豪气冲天",
        taskDescribe: "对局中购买/兑换礼包次数累计达到?次",
        taskType: 4,
        taskId: 1153,
        taskTimes: 20,
        typeId: 28,
        taskPrizes: {propId: 1116, number: 1, type: 4},
        taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20},
        liveness: 5
      },

      // 特殊成就-左右逢源
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1154,
        taskTimes: 1,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1155,
        taskTimes: 3,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1156,
        taskTimes: 5,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1157,
        taskTimes: 8,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1158,
        taskTimes: 10,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
      {
        taskName: "左右逢源",
        taskDescribe: "累计领取商城每日暖心福利达到?次",
        taskType: 4,
        taskId: 1159,
        taskTimes: 20,
        typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2},
        taskDesignates: {},
        liveness: 5
      },
    ];

    await Task.insertMany(datas);

    const result1 = await TaskTotalPrize.find();

    if (result1.length) {
      await TaskTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {number: 100, type: 1, propId: null, liveness: 150},
      {number: 150, type: 1, propId: null, liveness: 500},
      {number: 200, type: 1, propId: null, liveness: 800},
      {number: 1, type: 3, propId: 1019, liveness: 1000},
      {number: 1, type: 4, propId: 1117, liveness: 1500}
    ];

    await TaskTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入任务数据
  @addApi()
  async saveRegressionTaskData() {
    const result = await RegressionTask.find();

    if (result.length) {
      await RegressionTask.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      // 完成对局
      {
        taskName: "完成任意?场对局",
        taskId: 1001,
        typeId: 1,
        taskTimes: 1,
        taskPrizes: {number: 100000, type: 2},
        liveness: 20
      },
      {
        taskName: "完成任意?场对局",
        taskId: 1002,
        typeId: 1,
        taskTimes: 5,
        taskPrizes: {number: 200000, type: 2},
        liveness: 20
      },
      {
        taskName: "完成任意?场对局",
        taskId: 1003,
        typeId: 1,
        taskTimes: 10,
        taskPrizes: {number: 500000, type: 2},
        liveness: 30
      },

      // 领取开运福利奖励
      {
        taskName: "领取开运福利奖励?次",
        taskId: 1004,
        typeId: 2,
        taskTimes: 1,
        taskPrizes: {number: 100000, type: 2},
        liveness: 10
      },

      // 幸运抽奖
      {
        taskName: "进行?次幸运抽奖",
        taskId: 1005,
        typeId: 3,
        taskTimes: 1,
        taskPrizes: {number: 100000, type: 2},
        liveness: 10
      },

      // 看广告
      {
        taskName: "观看?次广告",
        taskId: 1006,
        typeId: 4,
        taskTimes: 1,
        taskPrizes: {number: 100000, type: 2},
        liveness: 10
      },
    ];

    await RegressionTask.insertMany(datas);

    const result1 = await regressionTaskTotalPrize.find();

    if (result1.length) {
      await regressionTaskTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {type: 1, taskPrizes: [{number: 100000, type: 2}, {number: 1000000, type: 7}], liveness: 10},
      {type: 1, taskPrizes: [{number: 200000, type: 2}, {number: 1500000, type: 7}], liveness: 20},
      {type: 1, taskPrizes: [{number: 200000, type: 2}, {number: 2000000, type: 7}], liveness: 30},
      {type: 1, taskPrizes: [{number: 300000, type: 2}, {number: 3000000, type: 7}], liveness: 50},
      {type: 1, taskPrizes: [{number: 600000, type: 2}, {number: 10, type: 1}], liveness: 100},
      {type: 2, taskPrizes: [{number: 200, type: 1}, {number: 1, type: 10, propId: 1310}, {number: 1, type: 10, propId: 1311}, {number: 1, type: 10, propId: 1312}, {number: 1, type: 10, propId: 1313}], liveness: 10},
      {type: 2, taskPrizes: [{number: 200, type: 1}, {number: 1, type: 10, propId: 1310}, {number: 1, type: 10, propId: 1311}, {number: 1, type: 10, propId: 1312}, {number: 1, type: 10, propId: 1313}], liveness: 30},
    ];

    await regressionTaskTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入vip特权数据
  @addApi()
  async saveVipData() {
    const result = await VipConfig.find();

    if (result.length) {
      await VipConfig.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        vip: 0,
        experience: 0,
        noteList: [{type: "new", note: "可领取5次救济金"}, {type: "new", note: "可进行10次幸运抽奖"}],
        prizeList: [{name: "50万金豆", number: 500000, type: 2}],
        benifitMultiple: 1
      },
      {
        vip: 1,
        experience: 300,
        noteList: [{type: "old", note: "可领取5次救济金"}, {type: "new", note: "可领取2倍救济金"}, {
          type: "new",
          note: "商城内使用钻石可兑换2倍金豆"
        }],
        prizeList: [{name: "100万金豆", number: 1000000, type: 2}, {name: "10钻石", number: 10, type: 1}],
        benifitMultiple: 2
      },
      {
        vip: 2,
        experience: 1000,
        noteList: [{type: "old", note: "可领取5次救济金"},
          {type: "upgrade", note: "可领取3倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换4倍金豆"}],
        prizeList: [{name: "200万金豆", number: 2000000, type: 2}, {name: "20钻石", number: 20, type: 1}],
        benifitMultiple: 3
      },
      {
        vip: 3,
        experience: 3000,
        noteList: [{type: "old", note: "可领取5次救济金"},
          {type: "upgrade", note: "可领取4倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换6倍金豆"}],
        prizeList: [{name: "400万金豆", number: 4000000, type: 2}, {name: "30钻石", number: 30, type: 1}],
        benifitMultiple: 4
      },
      {
        vip: 4,
        experience: 5000,
        noteList: [{type: "old", note: "可领取5次救济金"},
          {type: "upgrade", note: "可领取5倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换8倍金豆"}],
        prizeList: [{name: "500万金豆", number: 5000000, type: 2}, {name: "40钻石", number: 40, type: 1}],
        benifitMultiple: 5
      },
      {
        vip: 5,
        experience: 10000,
        noteList: [{type: "old", note: "可领取5次救济金"},
          {type: "upgrade", note: "可领取6倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换10倍金豆"}],
        prizeList: [{name: "1200万金豆", number: 12000000, type: 2}, {name: "50钻石", number: 50, type: 1}],
        benifitMultiple: 6
      },
      {
        vip: 6,
        experience: 30000,
        noteList: [{type: "old", note: "可领取5次救济金"},
          {type: "upgrade", note: "可领取7倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换12倍金豆"}],
        prizeList: [{name: "2500万金豆", number: 25000000, type: 2}, {name: "60钻石", number: 60, type: 1}],
        benifitMultiple: 7
      },
      {
        vip: 7,
        experience: 50000,
        noteList: [{type: "upgrade", note: "可领取8次救济金"},
          {type: "upgrade", note: "可领取10倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换14倍金豆"},
          {type: "new", note: "复活礼包可兑换2倍金豆"},
          {type: "new", note: "超值礼包可兑换2倍金豆"}],
        prizeList: [{name: "3000万金豆", number: 30000000, type: 2}, {name: "70钻石", number: 70, type: 1}],
        benifitMultiple: 10
      },
      {
        vip: 8,
        experience: 100000,
        noteList: [{type: "old", note: "可领取8次救济金"},
          {type: "upgrade", note: "可领取12倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换16倍金豆"},
          {type: "old", note: "复活礼包可兑换2倍金豆"},
          {type: "old", note: "超值礼包可兑换2倍金豆"}],
        prizeList: [{name: "5000万金豆", number: 50000000, type: 2}, {name: "80钻石", number: 80, type: 1}],
        benifitMultiple: 12
      },
      {
        vip: 9,
        experience: 300000,
        noteList: [{type: "old", note: "可领取8次救济金"},
          {type: "upgrade", note: "可领取14倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换18倍金豆"},
          {type: "old", note: "复活礼包可兑换2倍金豆"},
          {type: "old", note: "超值礼包可兑换2倍金豆"}],
        prizeList: [{name: "1亿金豆", number: 100000000, type: 2}, {name: "90钻石", number: 90, type: 1}],
        benifitMultiple: 14
      },
      {
        vip: 10,
        experience: 500000,
        noteList: [{type: "upgrade", note: "可领取10次救济金"},
          {type: "upgrade", note: "可领取16倍救济金"},
          {type: "upgrade", note: "商城内使用钻石可兑换20倍金豆"},
          {type: "upgrade", note: "复活礼包可兑换3倍金豆"},
          {type: "upgrade", note: "超值礼包可兑换3倍金豆"}],
        prizeList: [{name: "2亿金豆", number: 200000000, type: 2}, {name: "100钻石", number: 100, type: 1}],
        benifitMultiple: 16
      },
    ];

    await VipConfig.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入番型数据
  @addApi()
  async saveDebrisData() {
    const result = await Debris.find();

    if (result.length) {
      await Debris.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      // 番型-星蝎交辉
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1001,
        taskTimes: 9,
        typeId: 50,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1002,
        taskTimes: 50,
        typeId: 50,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1003,
        taskTimes: 100,
        typeId: 50,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1004,
        taskTimes: 300,
        typeId: 50,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1005,
        taskTimes: 500,
        typeId: 50,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "星蝎交辉",
        taskDescribe: "胡星蝎交辉番型次数达到?次",
        taskType: 1,
        taskId: 1006,
        taskTimes: 888,
        typeId: 150,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },

      // 番型-摩羯之吻
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1007,
        taskTimes: 9,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1008,
        taskTimes: 50,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1009,
        taskTimes: 100,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1010,
        taskTimes: 300,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1011,
        taskTimes: 500,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "摩羯之吻",
        taskDescribe: "胡摩羯之吻番型次数达到?次",
        taskType: 1,
        taskId: 1012,
        taskTimes: 888,
        typeId: 49,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },

      // 番型-众星捧月
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1013,
        taskTimes: 9,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1014,
        taskTimes: 50,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1015,
        taskTimes: 100,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1016,
        taskTimes: 300,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1017,
        taskTimes: 500,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "众星捧月",
        taskDescribe: "胡众星捧月番型次数达到?次",
        taskType: 1,
        taskId: 1018,
        taskTimes: 888,
        typeId: 48,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },

      // 番型-月落星沉
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1019,
        taskTimes: 9,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1020,
        taskTimes: 50,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1021,
        taskTimes: 100,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1022,
        taskTimes: 300,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1023,
        taskTimes: 500,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "月落星沉",
        taskDescribe: "胡月落星沉番型次数达到?次",
        taskType: 1,
        taskId: 1024,
        taskTimes: 888,
        typeId: 47,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-大步流星
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?次",
        taskType: 1,
        taskId: 1025,
        taskTimes: 9,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?",
        taskType: 1,
        taskId: 1026,
        taskTimes: 50,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?",
        taskType: 1,
        taskId: 1027,
        taskTimes: 100,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?",
        taskType: 1,
        taskId: 1028,
        taskTimes: 300,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?",
        taskType: 1,
        taskId: 1029,
        taskTimes: 500,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },
      {
        taskName: "大步流星",
        taskDescribe: "胡大步流星番型次数达到?",
        taskType: 1,
        taskId: 1030,
        taskTimes: 888,
        typeId: 46,
        taskPrizes: {name: "50万天乐豆", number: 500000, type: 7}
      },

      // 番型-星流影集
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1031,
        taskTimes: 9,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1032,
        taskTimes: 50,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1033,
        taskTimes: 100,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1034,
        taskTimes: 300,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1035,
        taskTimes: 500,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星流影集",
        taskDescribe: "胡星流影集番型次数达到?次",
        taskType: 1,
        taskId: 1036,
        taskTimes: 888,
        typeId: 45,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-移星换斗
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1037,
        taskTimes: 9,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1038,
        taskTimes: 50,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1039,
        taskTimes: 100,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1040,
        taskTimes: 300,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1041,
        taskTimes: 500,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "移星换斗",
        taskDescribe: "胡移星换斗番型次数达到?次",
        taskType: 1,
        taskId: 1042,
        taskTimes: 888,
        typeId: 44,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-一天星斗
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1043,
        taskTimes: 9,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1044,
        taskTimes: 50,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1045,
        taskTimes: 100,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1046,
        taskTimes: 300,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1047,
        taskTimes: 500,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },
      {
        taskName: "一天星斗",
        taskDescribe: "胡一天星斗番型次数达到?次",
        taskType: 1,
        taskId: 1048,
        taskTimes: 888,
        typeId: 43,
        taskPrizes: {name: "100万天乐豆", number: 1000000, type: 7}
      },

      // 番型-棋布星陈
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1049,
        taskTimes: 9,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1050,
        taskTimes: 50,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1051,
        taskTimes: 100,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1052,
        taskTimes: 300,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1053,
        taskTimes: 500,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "棋布星陈",
        taskDescribe: "胡棋布星陈番型次数达到?次",
        taskType: 1,
        taskId: 1054,
        taskTimes: 888,
        typeId: 42,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-星离月会
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1055,
        taskTimes: 9,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1056,
        taskTimes: 50,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1057,
        taskTimes: 100,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1058,
        taskTimes: 300,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1059,
        taskTimes: 500,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "星离月会",
        taskDescribe: "胡星离月会番型次数达到?次",
        taskType: 1,
        taskId: 1060,
        taskTimes: 888,
        typeId: 41,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-流星望电
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1061,
        taskTimes: 9,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1062,
        taskTimes: 50,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1063,
        taskTimes: 100,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1064,
        taskTimes: 300,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1065,
        taskTimes: 500,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "流星望电",
        taskDescribe: "胡流星望电番型次数达到?次",
        taskType: 1,
        taskId: 1066,
        taskTimes: 888,
        typeId: 40,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-星流电击
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1067,
        taskTimes: 9,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1068,
        taskTimes: 50,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1069,
        taskTimes: 100,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1070,
        taskTimes: 300,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1071,
        taskTimes: 500,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "星流电击",
        taskDescribe: "胡星流电击番型次数达到?次",
        taskType: 1,
        taskId: 1072,
        taskTimes: 888,
        typeId: 39,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 番型-三星高照
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1073,
        taskTimes: 9,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1074,
        taskTimes: 50,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1075,
        taskTimes: 100,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1076,
        taskTimes: 300,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1077,
        taskTimes: 500,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "三星高照",
        taskDescribe: "胡三星高照番型次数达到?次",
        taskType: 1,
        taskId: 1078,
        taskTimes: 888,
        typeId: 38,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 番型-一路福星
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1079,
        taskTimes: 9,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1080,
        taskTimes: 50,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1081,
        taskTimes: 100,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1},
      },
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1082,
        taskTimes: 300,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1083,
        taskTimes: 500,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },
      {
        taskName: "一路福星",
        taskDescribe: "胡一路福星番型次数达到?次",
        taskType: 1,
        taskId: 1084,
        taskTimes: 888,
        typeId: 37,
        taskPrizes: {name: "10钻石", number: 10, type: 1}
      },

      // 番型-十二星座
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1085,
        taskTimes: 9,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1086,
        taskTimes: 50,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1087,
        taskTimes: 100,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1088,
        taskTimes: 300,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1089,
        taskTimes: 500,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "十二星座",
        taskDescribe: "胡十二星座番型次数达到?次",
        taskType: 1,
        taskId: 1090,
        taskTimes: 888,
        typeId: 33,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-白羊座
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1091,
        taskTimes: 100,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1092,
        taskTimes: 300,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1093,
        taskTimes: 500,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1094,
        taskTimes: 800,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1095,
        taskTimes: 1000,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "白羊座",
        taskDescribe: "累计合成白羊杠达到?次",
        taskType: 2,
        taskId: 1096,
        taskTimes: 3000,
        typeId: 41,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-金牛座
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1097,
        taskTimes: 100,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1098,
        taskTimes: 300,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1099,
        taskTimes: 500,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1100,
        taskTimes: 800,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1101,
        taskTimes: 1000,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "金牛座",
        taskDescribe: "累计合成金牛杠达到?次",
        taskType: 2,
        taskId: 1102,
        taskTimes: 3000,
        typeId: 42,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-双子座
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1103,
        taskTimes: 100,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1104,
        taskTimes: 300,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1105,
        taskTimes: 500,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1106,
        taskTimes: 800,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1107,
        taskTimes: 1000,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双子座",
        taskDescribe: "累计合成双子杠达到?次",
        taskType: 2,
        taskId: 1108,
        taskTimes: 3000,
        typeId: 43,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-巨蟹座
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1109,
        taskTimes: 100,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1110,
        taskTimes: 300,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1111,
        taskTimes: 500,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1112,
        taskTimes: 800,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1113,
        taskTimes: 1000,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "巨蟹座",
        taskDescribe: "累计合成巨蟹杠达到?次",
        taskType: 2,
        taskId: 1114,
        taskTimes: 3000,
        typeId: 44,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-狮子座
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1115,
        taskTimes: 100,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1116,
        taskTimes: 300,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1117,
        taskTimes: 500,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1118,
        taskTimes: 800,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1119,
        taskTimes: 1000,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "狮子座",
        taskDescribe: "累计合成狮子杠达到?次",
        taskType: 2,
        taskId: 1120,
        taskTimes: 3000,
        typeId: 45,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-处女座
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1121,
        taskTimes: 100,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1122,
        taskTimes: 300,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1123,
        taskTimes: 500,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1124,
        taskTimes: 800,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1125,
        taskTimes: 1000,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "处女座",
        taskDescribe: "累计合成处女杠达到?次",
        taskType: 2,
        taskId: 1126,
        taskTimes: 3000,
        typeId: 46,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-天秤座
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1127,
        taskTimes: 100,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1128,
        taskTimes: 300,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1129,
        taskTimes: 500,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1130,
        taskTimes: 800,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1131,
        taskTimes: 1000,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天秤座",
        taskDescribe: "累计合成天秤杠达到?次",
        taskType: 2,
        taskId: 1132,
        taskTimes: 3000,
        typeId: 47,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-天蝎座
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1133,
        taskTimes: 100,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1134,
        taskTimes: 300,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1135,
        taskTimes: 500,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1136,
        taskTimes: 800,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1137,
        taskTimes: 1000,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "天蝎座",
        taskDescribe: "累计合成天蝎杠达到?次",
        taskType: 2,
        taskId: 1138,
        taskTimes: 3000,
        typeId: 48,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-射手座
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1139,
        taskTimes: 100,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1140,
        taskTimes: 300,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1141,
        taskTimes: 500,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1142,
        taskTimes: 800,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1143,
        taskTimes: 1000,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "射手座",
        taskDescribe: "累计合成射手杠达到?次",
        taskType: 2,
        taskId: 1144,
        taskTimes: 3000,
        typeId: 49,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-摩羯座
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1145,
        taskTimes: 100,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1147,
        taskTimes: 300,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1148,
        taskTimes: 500,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1149,
        taskTimes: 800,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1140,
        taskTimes: 1000,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "摩羯座",
        taskDescribe: "累计合成摩羯杠达到?次",
        taskType: 2,
        taskId: 1150,
        taskTimes: 3000,
        typeId: 50,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-水瓶座
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1151,
        taskTimes: 100,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1152,
        taskTimes: 300,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1153,
        taskTimes: 500,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1154,
        taskTimes: 800,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1155,
        taskTimes: 1000,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "水瓶座",
        taskDescribe: "累计合成水瓶杠达到?次",
        taskType: 2,
        taskId: 1156,
        taskTimes: 3000,
        typeId: 51,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },

      // 杠牌-双鱼座
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1157,
        taskTimes: 100,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1158,
        taskTimes: 300,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1159,
        taskTimes: 500,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1160,
        taskTimes: 800,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1161,
        taskTimes: 1000,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
      {
        taskName: "双鱼座",
        taskDescribe: "累计合成双鱼杠达到?次",
        taskType: 2,
        taskId: 1162,
        taskTimes: 3000,
        typeId: 52,
        taskPrizes: {name: "20万天乐豆", number: 200000, type: 7}
      },
    ];

    await Debris.insertMany(datas);

    const result1 = await DebrisTotalPrize.find();

    if (result1.length) {
      await DebrisTotalPrize.remove({_id: {$ne: null}}).exec();
    }

    const datas1 = [
      {number: 100, type: 1, propId: null, liveness: 10},
      {number: 150, type: 1, propId: null, liveness: 30},
      {number: 200, type: 1, propId: null, liveness: 100},
      {number: 1000000, type: 7, propId: null, liveness: 300},
      {number: 8880000, type: 7, propId: null, liveness: 888}
    ];

    await DebrisTotalPrize.insertMany(datas1);

    return this.replySuccess({datas, datas1});
  }

  // 录入回归礼包专属商店
  @addApi()
  async saveRegressionDiscountGift() {
    const result = await RegressionDiscountGift.find();

    if (result.length) {
      await RegressionDiscountGift.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {name: "回归超值礼包", price: 6, limitCount: 3, prizeList: [{type: 1, number: 120}, {type: 7, number: 60000000}]},
      {
        name: "回归助力礼包",
        price: 30,
        limitCount: 2,
        prizeList: [{type: 1, number: 600}, {type: 7, number: 300000000}]
      },
      {
        name: "回归畅玩礼包",
        price: 128,
        limitCount: 1,
        prizeList: [{type: 1, number: 2560}, {type: 7, number: 1280000000}]
      },
    ];

    await RegressionDiscountGift.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入头像框
  @addApi()
  async saveHeadBorder() {
    const result = await HeadBorder.find();

    if (result.length) {
      await HeadBorder.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {propId: 1001, name: "圣诞头像框", describe: "圣诞狂欢"},
      {propId: 1002, name: "招财进宝", describe: "招财进宝"},
      {propId: 1003, name: "熊猫憨憨", describe: "熊猫憨憨"},
      {propId: 1004, name: "麻辣英雄", describe: "麻辣英雄"},
      {propId: 1005, name: "锦鲤破浪", describe: "锦鲤破浪"},
      {propId: 1006, name: "金属时代", describe: "金属时代"},
      {propId: 1007, name: "机械之心", describe: "机械之心"},
      {propId: 1008, name: "招财猫", describe: "招财猫"},
      {propId: 1009, name: "黄金之风", describe: "黄金之风"},
      {propId: 1010, name: "恭喜发财", describe: "恭喜发财"},
      {propId: 1011, name: "贵族气质", describe: "贵族气质"},
      {propId: 1012, name: "初出茅庐", describe: "初出茅庐"},
    ];

    await HeadBorder.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入称号
  @addApi()
  async saveMedal() {
    const result = await Medal.find();

    if (result.length) {
      await Medal.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {propId: 1101, name: "天道酬勤", describe: "当日累计对局数达到3局"},
      {propId: 1102, name: "颜值担当", describe: "累计拥有10个永久头像框"},
      {propId: 1103, name: "收藏家", describe: "累计拥有永久牌桌10个"},
      {propId: 1104, name: "收割机器", describe: "对局结算时赢豆数量达到1999.99万豆"},
      {propId: 1105, name: "散财童子", describe: "对局结算时输豆数量达到999.99万豆"},
      {propId: 1106, name: "高处不胜寒", describe: "封顶次数(21万倍以上)达到199次"},
      {propId: 1107, name: "赛诸葛", describe: "对局连胜达到15局"},
      {propId: 1108, name: "回村的诱惑", describe: "累计对局结束破产次数达到100次"},
      {propId: 1109, name: "疯狂屠夫", describe: "累计使认输人数达到300人"},
      {propId: 1110, name: "我能翻盘", describe: "对剧中因海底捞月或者妙手回春由输转赢达到20次"},
      {propId: 1111, name: "高岭之花", describe: "累计杠上开花次数达到100次"},
      {propId: 1112, name: "落地成盒", describe: "累计被天胡破产44次"},
      {propId: 1113, name: "潘达守护者", describe: "累计胡四节高达到100局"},
      {propId: 1114, name: "青青草原", describe: "累计胡绿一色达到100局"},
      {propId: 1115, name: "天选之人", describe: "累计天胡次数达到66次"},
      {propId: 1116, name: "铁头功", describe: "对局中购买/兑换礼包次数累计达到3次"},
      {propId: 1117, name: "闻名雀坛", describe: "成就点数达到1500"},
      {propId: 1118, name: "零号玩家", describe: "累计签到天数达到100天"},
      {propId: 1119, name: "快枪手", describe: "累计对局中最先胡牌达到111局"},
      {propId: 1120, name: "禁止划水", describe: "累计流局达到50次"},
      {propId: 1121, name: "嘎嘎乱杀", describe: "累计66局中首次胡牌就清空三个对手"},
      {propId: 1122, name: "钻石王老五", describe: "拥有钻石数大于8888"},
      {propId: 1123, name: "点金手", describe: "在商城用钻石兑换金豆30次"},
      {propId: 1124, name: "持之以恒", describe: "新手宝典活动中签到7天"},
      {propId: 1124, name: "氪金玩家", describe: "新手宝典完成首充活动"},
    ];

    await Medal.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入牌桌
  @addApi()
  async saveCardTable() {
    const result = await CardTable.find();

    if (result.length) {
      await CardTable.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {propId: 1201, name: "天宫", describe: "天宫"},
      {propId: 1202, name: "四季常春", describe: "四季常春"},
      {propId: 1203, name: "圣诞狂欢", describe: "圣诞狂欢"},
      {propId: 1204, name: "金銮凤舞", describe: "金銮凤舞"},
      {propId: 1205, name: "熊猫幻想乡", describe: "熊猫幻想乡"},
      {propId: 1206, name: "赛博朋克", describe: "赛博朋克"},
      {propId: 1207, name: "贵族气质", describe: "贵族气质"},
    ];

    await CardTable.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入商城道具
  @addApi()
  async saveGoodsProp() {
    const result = await GoodsProp.find();

    if (result.length) {
      await GoodsProp.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        propId: 1301,
        name: "记牌器",
        describe: "对局中可以使用此道具查看剩余牌数",
        payType: 1,
        propType: 1,
        priceList: [{count: 1, price: 1}, {count: 10, price: 8}, {count: 100, price: 60}]
      },
      {
        propId: 1302,
        name: "求签卡",
        describe: "对局中可以使用求签卡查看今日运势",
        payType: 2,
        propType: 2,
        priceList: [{count: 1, price: 10}, {count: 10, price: 80}, {count: 100, price: 600}]
      },
      {
        propId: 1303,
        name: "洗牌卡",
        describe: "小局开始前可以使用洗牌卡进行洗牌",
        payType: 2,
        propType: 3,
        priceList: [{count: 1, price: 2}, {count: 10, price: 8}, {count: 100, price: 60}]
      },
      {
        propId: 1304,
        name: "财神祈福卡",
        describe: "对局中可以使用财神祈福卡进行财神祈福",
        payType: 2,
        propType: 4,
        childType: 1,
        priceList: [{count: 1, price: 1}, {count: 10, price: 16}, {count: 100, price: 120}]
      },
      {
        propId: 1305,
        name: "关公祈福卡",
        describe: "对局中可以使用关公祈福卡进行关公祈福",
        payType: 2,
        propType: 4,
        childType: 2,
        priceList: [{count: 1, price: 1}, {count: 10, price: 16}, {count: 100, price: 120}]
      },
      {
        propId: 1306,
        name: "老君祈福卡",
        describe: "对局中可以使用老君祈福卡进行老君祈福",
        payType: 2,
        propType: 4,
        childType: 3,
        priceList: [{count: 1, price: 1}, {count: 10, price: 16}, {count: 100, price: 120}]
      },
      {
        propId: 1307,
        name: "招财猫祈福卡",
        describe: "对局中可以使用招财猫祈福卡进行招财猫祈福",
        payType: 2,
        propType: 4,
        childType: 4,
        priceList: [{count: 1, price: 1}, {count: 10, price: 16}, {count: 100, price: 120}]
      },
      {
        propId: 1308,
        name: "冷笑",
        describe: "对局中可以使用冷笑表情包",
        payType: 1,
        propType: 5,
        childType: 5,
        priceList: [{count: 1, price: 3}, {count: 10, price: 24}, {count: 100, price: 180}]
      },
      {
        propId: 1309,
        name: "西红柿",
        describe: "对局中可以使用西红柿道具砸人",
        payType: 1,
        propType: 6,
        childType: 6,
        priceList: [{count: 1, price: 3}, {count: 10, price: 24}, {count: 100, price: 180}]
      },
      {
        propId: 1001,
        name: "星之王冠",
        describe: "星之王冠",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1002,
        name: "糖果世界",
        describe: "糖果世界",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1003,
        name: "童真风车",
        describe: "童真风车",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1004,
        name: "桃园风景",
        describe: "桃园风景",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1005,
        name: "海底世界",
        describe: "海底世界",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1006,
        name: "绅士帽子",
        describe: "绅士帽子",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1007,
        name: "太空时代",
        describe: "太空时代",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1008,
        name: "少女粉屋",
        describe: "少女粉屋",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1009,
        name: "招财猫",
        describe: "招财猫",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1010,
        name: "古巴比伦",
        describe: "古巴比伦",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1014,
        name: "熊猫憨憨",
        describe: "熊猫憨憨",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1015,
        name: "玩偶房子",
        describe: "玩偶房子",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
      {
        propId: 1016,
        name: "机械之心",
        describe: "机械之心",
        payType: 1,
        propType: 7,
        priceList: [{count: 7, price: 28}, {count: 30, price: 98}, {count: -1, price: 598}]
      },
    ];

    await GoodsProp.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入兑换天乐币数据
  @addApi()
  async saveGoodsReviveTlGolds() {
    const result = await GoodsReviveTlGold.find();

    if (result.length) {
      await GoodsReviveTlGold.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {gold: 100000, tlGold: 100000, category: "6570528ad62f7eaa7a4e3b0d", gameType: "majiang"},
      {gold: 500000, tlGold: 500000, category: "6570528ad62f7eaa7a4e3b0d", gameType: "majiang"},
      {gold: 1000000, tlGold: 1000000, category: "6570528ad62f7eaa7a4e3b0d", gameType: "majiang"},
      {gold: 3000000, tlGold: 3000000, category: "6570528ad62f7eaa7a4e3b0d", gameType: "majiang"},

      {gold: 20000000, tlGold: 20000000, category: "6570528ad62f7eaa7a4e3b0e", gameType: "majiang"},
      {gold: 50000000, tlGold: 50000000, category: "6570528ad62f7eaa7a4e3b0e", gameType: "majiang"},
      {gold: 100000000, tlGold: 100000000, category: "6570528ad62f7eaa7a4e3b0e", gameType: "majiang"},
      {gold: 300000000, tlGold: 300000000, category: "6570528ad62f7eaa7a4e3b0e", gameType: "majiang"},

      {gold: 500000000, tlGold: 500000000, category: "6570528ad62f7eaa7a4e3b0f", gameType: "majiang"},
      {gold: 800000000, tlGold: 800000000, category: "6570528ad62f7eaa7a4e3b0f", gameType: "majiang"},
      {gold: 100000000, tlGold: 100000000, category: "6570528ad62f7eaa7a4e3b0f", gameType: "majiang"},
      {gold: 1500000000, tlGold: 1500000000, category: "6570528ad62f7eaa7a4e3b0f", gameType: "majiang"},

      {gold: 2000000000, tlGold: 2000000000, category: "6570528ad62f7eaa7a4e3b10", gameType: "majiang"},
      {gold: 3000000000, tlGold: 3000000000, category: "6570528ad62f7eaa7a4e3b10", gameType: "majiang"},
      {gold: 4000000000, tlGold: 4000000000, category: "6570528ad62f7eaa7a4e3b10", gameType: "majiang"},
      {gold: 5000000000, tlGold: 5000000000, category: "6570528ad62f7eaa7a4e3b10", gameType: "majiang"},

      {gold: 6000000000, tlGold: 6000000000, category: "6570528ad62f7eaa7a4e3b11", gameType: "majiang"},
      {gold: 8000000000, tlGold: 8000000000, category: "6570528ad62f7eaa7a4e3b11", gameType: "majiang"},
      {gold: 10000000000, tlGold: 10000000000, category: "6570528ad62f7eaa7a4e3b11", gameType: "majiang"},
      {gold: 30000000000, tlGold: 30000000000, category: "6570528ad62f7eaa7a4e3b11", gameType: "majiang"},
    ];

    await GoodsReviveTlGold.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入每日补充包数据
  @addApi()
  async saveGoodsDailyTlGolds() {
    const result = await GoodsDailySupplement.find();

    if (result.length) {
      await GoodsDailySupplement.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        level: 1,
        price: 6,
        originPrice: 22,
        gold: 500000000,
        todayReceiveLimit: 3,
        maxReceiveDayLimit: 7,
        todayReceiveGold: 50000,
        gameType: "majiang"
      },
      {
        level: 2,
        price: 30,
        originPrice: 1250,
        gold: 2000000000,
        todayReceiveLimit: 3,
        maxReceiveDayLimit: 7,
        todayReceiveGold: 200000,
        gameType: "majiang"
      },
      {
        level: 3,
        price: 128,
        originPrice: 24200,
        gold: 200000000000,
        todayReceiveLimit: 3,
        maxReceiveDayLimit: 7,
        todayReceiveGold: 20000000,
        gameType: "majiang"
      },
    ];

    await GoodsDailySupplement.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入红包配置
  @addApi()
  async saveRedPocketConfig() {
    const result = await WithdrawConfig.find();

    if (result.length) {
      await WithdrawConfig.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        amount: 0.12,
        limitCount: 1,
        juShu: 5,
        type: 1
      },
      {
        amount: 888,
        limitCount: 1,
        juShu: 0,
        type: 2
      },
      {
        amount: 1088,
        limitCount: 1,
        juShu: 0,
        type: 2
      },
    ];

    await WithdrawConfig.insertMany(datas);

    return this.replySuccess(datas);
  }

  // 录入牌型
  @addApi()
  async saveCardType() {
    const result = await CardType.find();

    if (result.length) {
      await CardType.remove({_id: {$ne: null}}).exec();
    }
    const cardTypes = [
      // 十二星座
      {cardName: "起手叫", multiple: 4, gameType: "majiang", cardId: 1},
      {cardName: "双星辰", multiple: 4, gameType: "majiang", cardId: 2},
      {
        cardName: "门清",
        multiple: 2,
        gameType: "majiang",
        cardId: 3
      },
      {cardName: "杠上开花", multiple: 3, gameType: "majiang", cardId: 4},
      {
        cardName: "妙手回春",
        multiple: 3,
        gameType: "majiang",
        cardId: 5
      },
      {
        cardName: "海底捞月",
        multiple: 2,
        gameType: "majiang",
        cardId: 6
      },
      {
        cardName: "杠上炮",
        multiple: 2,
        gameType: "majiang",
        cardId: 7
      },
      {
        cardName: "抢杠胡",
        multiple: 2,
        gameType: "majiang",
        cardId: 8
      },
      {cardName: "绝张", multiple: 2, gameType: "majiang", cardId: 9},
      {
        cardName: "对对胡",
        multiple: 2,
        gameType: "majiang",
        cardId: 10
      },
      {cardName: "单色星辰", multiple: 2, gameType: "majiang", cardId: 11},
      {cardName: "双同刻", multiple: 2, gameType: "majiang", cardId: 12},
      {cardName: "十二行星", multiple: 3, gameType: "majiang", cardId: 13},
      {cardName: "十八行星", multiple: 4, gameType: "majiang", cardId: 14},
      {
        cardName: "断么九",
        multiple: 6,
        gameType: "majiang",
        cardId: 15
      },
      {
        cardName: "不求人",
        multiple: 6,
        gameType: "majiang",
        cardId: 16
      },
      {
        cardName: "混双",
        multiple: 6,
        gameType: "majiang",
        cardId: 17
      },
      {
        cardName: "混单",
        multiple: 6,
        gameType: "majiang",
        cardId: 18
      },
      {cardName: "双暗刻", multiple: 6, gameType: "majiang", cardId: 19},
      {
        cardName: "三节高",
        multiple: 8,
        gameType: "majiang",
        cardId: 20
      },
      {cardName: "双色星辰", multiple: 8, gameType: "majiang", cardId: 21},
      {cardName: "混小", multiple: 12, gameType: "majiang", cardId: 22},
      {cardName: "混中", multiple: 12, gameType: "majiang", cardId: 23},
      {cardName: "混大", multiple: 12, gameType: "majiang", cardId: 24},
      {cardName: "星灭光离", multiple: 12, gameType: "majiang", cardId: 25},
      {cardName: "三暗刻", multiple: 12, gameType: "majiang", cardId: 26},
      {cardName: "三色星辰", multiple: 16, gameType: "majiang", cardId: 27},
      {cardName: "七对", multiple: 16, gameType: "majiang", cardId: 28},
      {
        cardName: "四节高",
        multiple: 16,
        gameType: "majiang",
        cardId: 29
      },
      {cardName: "全单刻", multiple: 24, gameType: "majiang", cardId: 30},
      {cardName: "全双刻", multiple: 24, gameType: "majiang", cardId: 31},
      {cardName: "四暗刻", multiple: 24, gameType: "majiang", cardId: 32},
      {
        cardName: "十二星座",
        multiple: 24,
        gameType: "majiang",
        cardId: 33
      },
      {cardName: "地胡", multiple: 32, gameType: "majiang", cardId: 34},
      {cardName: "景星麟凤", multiple: 36, gameType: "majiang", cardId: 35},
      {cardName: "天胡", multiple: 48, gameType: "majiang", cardId: 36},
      {cardName: "一路福星", multiple: 72, gameType: "majiang", cardId: 37},
      {cardName: "三星高照", multiple: 99, gameType: "majiang", cardId: 38},
      {cardName: "星流电击", multiple: 188, gameType: "majiang", cardId: 39},
      {cardName: "流星望电", multiple: 246, gameType: "majiang", cardId: 40},
      {cardName: "星离月会", multiple: 266, gameType: "majiang", cardId: 41},
      {cardName: "棋布星陈", multiple: 288, gameType: "majiang", cardId: 42},
      {cardName: "一天星斗", multiple: 288, gameType: "majiang", cardId: 43},
      {cardName: "移星换斗", multiple: 299, gameType: "majiang", cardId: 44},
      {cardName: "星流影集", multiple: 318, gameType: "majiang", cardId: 45},
      {cardName: "大步流星", multiple: 333, gameType: "majiang", cardId: 46},
      {cardName: "月落星沉", multiple: 366, gameType: "majiang", cardId: 47},
      {cardName: "众星捧月", multiple: 377, gameType: "majiang", cardId: 48},
      {cardName: "摩羯之吻", multiple: 399, gameType: "majiang", cardId: 49},
      {cardName: "星蝎交辉", multiple: 488, gameType: "majiang", cardId: 50},

      // 血流红中
      {cardName: "清幺九", multiple: 88, gameType: "xueliu", cardId: 51},
      {cardName: "连七对", multiple: 88, gameType: "xueliu", cardId: 52},
      {cardName: "一色双龙会", multiple: 64, gameType: "xueliu", cardId: 53},
      {cardName: "九莲宝灯", multiple: 64, gameType: "xueliu", cardId: 54},
      {cardName: "天胡", multiple: 48, gameType: "xueliu", cardId: 55},
      {cardName: "绿一色", multiple: 48, gameType: "xueliu", cardId: 56},
      {cardName: "地胡", multiple: 24, gameType: "xueliu", cardId: 57},
      {cardName: "十八罗汉", multiple: 24, gameType: "xueliu", cardId: 58},
      {cardName: "全大", multiple: 24, gameType: "xueliu", cardId: 59},
      {cardName: "全中", multiple: 24, gameType: "xueliu", cardId: 60},
      {cardName: "全小", multiple: 24, gameType: "xueliu", cardId: 61},
      {cardName: "四节高", multiple: 24, gameType: "xueliu", cardId: 62},
      {cardName: "四暗刻", multiple: 16, gameType: "xueliu", cardId: 63},
      {cardName: "十二金钗", multiple: 12, gameType: "xueliu", cardId: 64},
      {cardName: "全双刻", multiple: 12, gameType: "xueliu", cardId: 65},
      {cardName: "三节高", multiple: 12, gameType: "xueliu", cardId: 66},
      {cardName: "金钩钩", multiple: 8, gameType: "xueliu", cardId: 67},
      {cardName: "百万石", multiple: 8, gameType: "xueliu", cardId: 68},
      {cardName: "大于五", multiple: 8, gameType: "xueliu", cardId: 69},
      {cardName: "小于五", multiple: 8, gameType: "xueliu", cardId: 70},
      {cardName: "三暗刻", multiple: 6, gameType: "xueliu", cardId: 71},
      {cardName: "七对", multiple: 6, gameType: "xueliu", cardId: 72},
      {cardName: "清一色", multiple: 6, gameType: "xueliu", cardId: 73},
      {cardName: "清龙", multiple: 6, gameType: "xueliu", cardId: 74},
      {cardName: "杠上开花", multiple: 4, gameType: "xueliu", cardId: 75},
      {cardName: "推不倒", multiple: 4, gameType: "xueliu", cardId: 76},
      {cardName: "不求人", multiple: 4, gameType: "xueliu", cardId: 77},
      {cardName: "对对胡", multiple: 2, gameType: "xueliu", cardId: 78},
      {cardName: "老少副", multiple: 2, gameType: "xueliu", cardId: 79},
      {cardName: "门清", multiple: 2, gameType: "xueliu", cardId: 80},
      {cardName: "断幺九", multiple: 2, gameType: "xueliu", cardId: 81},
      {cardName: "双暗刻", multiple: 2, gameType: "xueliu", cardId: 82},
      {cardName: "双同刻", multiple: 2, gameType: "xueliu", cardId: 83},
      {cardName: "坎张", multiple: 2, gameType: "xueliu", cardId: 84},
      {cardName: "边张", multiple: 2, gameType: "xueliu", cardId: 85},
      {cardName: "妙手回春", multiple: 2, gameType: "xueliu", cardId: 86},
      {cardName: "海底捞月", multiple: 2, gameType: "xueliu", cardId: 87},
      {cardName: "杠上炮", multiple: 2, gameType: "xueliu", cardId: 88},
      {cardName: "绝张", multiple: 2, gameType: "xueliu", cardId: 89},
      {cardName: "抢杠胡", multiple: 2, gameType: "xueliu", cardId: 90},
      {cardName: "根", multiple: 2, gameType: "xueliu", cardId: 91},

      // 国标血流
      {cardName: "绝张", multiple: 2, gameType: "guobiao", cardId: 92},
      {cardName: "妙手回春", multiple: 2, gameType: "guobiao", cardId: 93},
      {cardName: "海底捞月", multiple: 2, gameType: "guobiao", cardId: 94},
      {cardName: "杠上开花", multiple: 2, gameType: "guobiao", cardId: 95},
      {cardName: "双同刻", multiple: 4, gameType: "guobiao", cardId: 96},
      {cardName: "三花聚顶", multiple: 6, gameType: "guobiao", cardId: 97},
      {cardName: "不求人", multiple: 6, gameType: "guobiao", cardId: 98},
      {cardName: "断幺九", multiple: 6, gameType: "guobiao", cardId: 99},
      {cardName: "四季发财", multiple: 8, gameType: "guobiao", cardId: 100},
      {cardName: "推不倒", multiple: 8, gameType: "guobiao", cardId: 101},
      {cardName: "清一色", multiple: 8, gameType: "guobiao", cardId: 102},
      {cardName: "五福临门", multiple: 10, gameType: "guobiao", cardId: 103},
      {cardName: "双暗刻", multiple: 12, gameType: "guobiao", cardId: 104},
      {cardName: "素胡", multiple: 12, gameType: "guobiao", cardId: 105},
      {cardName: "大于五", multiple: 12, gameType: "guobiao", cardId: 106},
      {cardName: "小于五", multiple: 12, gameType: "guobiao", cardId: 107},
      {cardName: "混一色", multiple: 16, gameType: "guobiao", cardId: 108},
      {cardName: "三同刻", multiple: 16, gameType: "guobiao", cardId: 109},
      {cardName: "七对", multiple: 16, gameType: "guobiao", cardId: 110},
      {cardName: "对对胡", multiple: 18, gameType: "guobiao", cardId: 111},
      {cardName: "全单刻", multiple: 24, gameType: "guobiao", cardId: 112},
      {cardName: "全双刻", multiple: 24, gameType: "guobiao", cardId: 113},
      {cardName: "混单刻", multiple: 24, gameType: "guobiao", cardId: 114},
      {cardName: "混双刻", multiple: 24, gameType: "guobiao", cardId: 115},
      {cardName: "一色三节高", multiple: 24, gameType: "guobiao", cardId: 116},
      {cardName: "十二金钗", multiple: 24, gameType: "guobiao", cardId: 117},
      {cardName: "三暗刻", multiple: 24, gameType: "guobiao", cardId: 118},
      {cardName: "一色四节高", multiple: 32, gameType: "guobiao", cardId: 119},
      {cardName: "地和", multiple: 32, gameType: "guobiao", cardId: 120},
      {cardName: "小三元", multiple: 33, gameType: "guobiao", cardId: 121},
      {cardName: "沧海独钓", multiple: 36, gameType: "guobiao", cardId: 122},
      {cardName: "小四喜", multiple: 44, gameType: "guobiao", cardId: 123},
      {cardName: "全大", multiple: 48, gameType: "guobiao", cardId: 124},
      {cardName: "全中", multiple: 48, gameType: "guobiao", cardId: 125},
      {cardName: "全小", multiple: 48, gameType: "guobiao", cardId: 126},
      {cardName: "天和", multiple: 48, gameType: "guobiao", cardId: 127},
      {cardName: "二色三节高", multiple: 48, gameType: "guobiao", cardId: 128},
      {cardName: "四暗刻", multiple: 48, gameType: "guobiao", cardId: 129},
      {cardName: "字一色", multiple: 48, gameType: "guobiao", cardId: 130},
      {cardName: "五门齐", multiple: 55, gameType: "guobiao", cardId: 131},
      {cardName: "三色三节高", multiple: 56, gameType: "guobiao", cardId: 132},
      {cardName: "二色四节高", multiple: 56, gameType: "guobiao", cardId: 133},
      {cardName: "十八罗汉", multiple: 64, gameType: "guobiao", cardId: 134},
      {cardName: "三色四节高", multiple: 64, gameType: "guobiao", cardId: 135},
      {cardName: "绿一色", multiple: 66, gameType: "guobiao", cardId: 136},
      {cardName: "三风刻", multiple: 88, gameType: "guobiao", cardId: 137},
      {cardName: "九五至尊", multiple: 150, gameType: "guobiao", cardId: 138},
      {cardName: "天降鸿福", multiple: 166, gameType: "guobiao", cardId: 139},
      {cardName: "混三节", multiple: 188, gameType: "guobiao", cardId: 140},
      {cardName: "清老头", multiple: 191, gameType: "guobiao", cardId: 141},
      {cardName: "大三元", multiple: 333, gameType: "guobiao", cardId: 142},
      {cardName: "大四喜", multiple: 444, gameType: "guobiao", cardId: 143},
      {cardName: "百花齐放", multiple: 666, gameType: "guobiao", cardId: 144},
      {cardName: "东成西就", multiple: 688, gameType: "guobiao", cardId: 145},
      {cardName: "北雁南飞", multiple: 688, gameType: "guobiao", cardId: 146},
      {cardName: "紫气东来", multiple: 777, gameType: "guobiao", cardId: 147},
      {cardName: "意气风发", multiple: 888, gameType: "guobiao", cardId: 148},
      {cardName: "西北望乡", multiple: 888, gameType: "guobiao", cardId: 149},
      {cardName: "风中烛影", multiple: 888, gameType: "guobiao", cardId: 150},
      {cardName: "十三太保", multiple: 6666, gameType: "guobiao", cardId: 151},
      {cardName: "东南见月", multiple: 8888, gameType: "guobiao", cardId: 152},
      {cardName: "七星连珠", multiple: 8888, gameType: "guobiao", cardId: 153},

      // 红包麻将
      {cardName: "清一色", multiple: 2, gameType: "redpocket", cardId: 163},
      {cardName: "混一色", multiple: 2, gameType: "redpocket", cardId: 164},
      {cardName: "清碰胡", multiple: 4, gameType: "redpocket", cardId: 165},
      {cardName: "混碰胡", multiple: 4, gameType: "redpocket", cardId: 166},
      {cardName: "小三元", multiple: 8, gameType: "redpocket", cardId: 167},
      {cardName: "一条龙", multiple: 16, gameType: "redpocket", cardId: 168},
    ];
    await CardType.insertMany(cardTypes);
  }

  // 更新头像信息
  @addApi()
  async updatePlayerAvatar() {
    const result = await Player.find({avatar: {$regex: /https:\/\/im-serve.oss-cn-beijing.aliyuncs.com/}});
    const avatars = [];

    for (let i = 0; i < result.length; i++) {
      result[i].avatar = result[i].avatar.replace(/https:\/\/im-serve.oss-cn-beijing.aliyuncs.com\//g, 'https://tianlegame.hfdsdas.cn/');
      avatars.push(result[i].avatar);

      await Player.update({_id: result[i]._id}, {$set: {avatar: result[i].avatar}});
    }

    return this.replySuccess(avatars);
  }

  // 录入每日补充包
  @addApi()
  async saveDailySupplementGifts() {
    const result = await DailySupplementGift.find();

    if (result.length) {
      await DailySupplementGift.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      {
        name: "初级周卡",//名称
        level: 1,//等级
        payPrize: {type: 7, number: 500000000},
        dailyPrize: {type: 7, number: 20000000},
        price: 6,// 价格
        originPrice: 92,// 原价
        dailyReceiveCount: 3,//每日领取次数
        currency: "tlGold",//币种
      },
      {
        name: "进阶周卡",//名称
        level: 2,//等级
        payPrize: {type: 7, number: 2000000000},
        dailyPrize: {type: 7, number: 500000000},
        price: 30,// 价格
        originPrice: 1250,// 原价
        dailyReceiveCount: 3,//每日领取次数
        currency: "tlGold",//币种
      },
      {
        name: "高级周卡",//名称
        level: 3,//等级
        payPrize: {type: 7, number: 200000000000},
        dailyPrize: {type: 7, number: 2000000000},
        price: 128,// 价格
        originPrice: 24200,// 原价
        dailyReceiveCount: 3,//每日领取次数
        currency: "tlGold",//币种
      },
    ];

    await DailySupplementGift.insertMany(datas);

    return this.replySuccess(datas);
  }
}
