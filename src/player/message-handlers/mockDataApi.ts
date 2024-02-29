
import {addApi, BaseApi} from "./baseApi";

import Player from "../../database/models/player";
import TurntablePrize from "../../database/models/turntablePrize";
import SevenSignPrize from "../../database/models/SevenSignPrize";
import HeadBorder from "../../database/models/HeadBorder";
import Medal from "../../database/models/Medal";
import CardTable from "../../database/models/CardTable";
import Task from "../../database/models/task";
import TaskTotalPrize from "../../database/models/TaskTotalPrize";

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

  // 录入任务数据
  @addApi()
  async saveTaskData() {
    const result = await Task.find();

    if (result.length) {
      await Task.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      // 成长成就-富可敌国
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/88", taskType: 1, taskId: 1001, taskTimes: 88, typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/388", taskType: 1, taskId: 1002, taskTimes: 388, typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/888", taskType: 1, taskId: 1003, taskTimes: 388, typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/2888", taskType: 1, taskId: 1004, taskTimes: 2888, typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/5888", taskType: 1, taskId: 1005, taskTimes: 5888, typeId: 1,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "富可敌国", taskDescribe: "拥有钻石数大于?/8888", taskType: 1, taskId: 1006, taskTimes: 8888, typeId: 1,
        taskPrizes: {propId: 1122, number: 1, type: 4}, taskDesignates: {title: "富可敌国", propId: 1122, taskTimes: 8888}, liveness: 10},

      // 成长成就-宴会大亨
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/7天", taskType: 1, taskId: 1007, taskTimes: 7, typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/14天", taskType: 1, taskId: 1008, taskTimes: 14, typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/30天", taskType: 1, taskId: 1009, taskTimes: 30, typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/58天", taskType: 1, taskId: 1010, taskTimes: 58, typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/88天", taskType: 1, taskId: 1011, taskTimes: 88, typeId: 2,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "宴会大亨", taskDescribe: "累计签到天数达到?/100天", taskType: 1, taskId: 1012, taskTimes: 100, typeId: 2,
        taskPrizes: {propId: 1118, number: 1, type: 4}, taskDesignates: {title: "宴会大亨", propId: 1118, taskTimes: 100}, liveness: 5},

      // 成长成就-久经沙场
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/20局", taskType: 1, taskId: 1013, taskTimes: 20, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/50局", taskType: 1, taskId: 1014, taskTimes: 50, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/99局", taskType: 1, taskId: 1015, taskTimes: 99, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/288局", taskType: 1, taskId: 1016, taskTimes: 288, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/888局", taskType: 1, taskId: 1017, taskTimes: 888, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/1888局", taskType: 1, taskId: 1018, taskTimes: 1888, typeId: 3,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-天道酬勤
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/10局", taskType: 1, taskId: 1019, taskTimes: 10, typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/20局", taskType: 1, taskId: 1020, taskTimes: 20, typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/30局", taskType: 1, taskId: 1021, taskTimes: 30, typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/50局", taskType: 1, taskId: 1022, taskTimes: 50, typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/68局", taskType: 1, taskId: 1023, taskTimes: 68, typeId: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/88局", taskType: 1, taskId: 1024, taskTimes: 88, typeId: 4,
        taskPrizes: {propId: 1101, number: 1, type: 4}, taskDesignates: {title: "天道酬勤", propId: 1118, taskTimes: 88}, liveness: 15},

      // 成长成就-人生赢家
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/1500万", taskType: 1, taskId: 1025, taskTimes: 15000000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/3000万", taskType: 1, taskId: 1026, taskTimes: 30000000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/5888万", taskType: 1, taskId: 1027, taskTimes: 58880000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/8888万", taskType: 1, taskId: 1028, taskTimes: 88880000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/5亿", taskType: 1, taskId: 1029, taskTimes: 500000000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/20亿", taskType: 1, taskId: 1030, taskTimes: 2000000000, typeId: 5,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-收藏家
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/1个", taskType: 1, taskId: 1031, taskTimes: 1, typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 1}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/2个", taskType: 1, taskId: 1032, taskTimes: 2, typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 2}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/3个", taskType: 1, taskId: 1033, taskTimes: 3, typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 3}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/4个", taskType: 1, taskId: 1034, taskTimes: 4, typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 4}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/5个", taskType: 1, taskId: 1035, taskTimes: 5, typeId: 6,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 5}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/7个", taskType: 1, taskId: 1036, taskTimes: 7, typeId: 6,
        taskPrizes: {propId: 1103, number: 1, type: 4}, taskDesignates: {title: "收藏家", propId: 1118, taskTimes: 7}, liveness: 5},

      // 成长成就-颜值担当
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/1个", taskType: 1, taskId: 1037, taskTimes: 1, typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 1}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/2个", taskType: 1, taskId: 1038, taskTimes: 2, typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 2}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/3个", taskType: 1, taskId: 1039, taskTimes: 3, typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 3}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/5个", taskType: 1, taskId: 1040, taskTimes: 5, typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 5}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/8个", taskType: 1, taskId: 1041, taskTimes: 8, typeId: 7,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 8}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/10个", taskType: 1, taskId: 1042, taskTimes: 10, typeId: 7,
        taskPrizes: {propId: 1102, number: 1, type: 4}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10}, liveness: 5},

      // 成长成就-贵族气质
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/1级", taskType: 1, taskId: 1043, taskTimes: 1, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/2级", taskType: 1, taskId: 1044, taskTimes: 2, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/3级", taskType: 1, taskId: 1045, taskTimes: 3, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/4级", taskType: 1, taskId: 1046, taskTimes: 4, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/5级", taskType: 1, taskId: 1047, taskTimes: 5, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/6级", taskType: 1, taskId: 1048, taskTimes: 6, typeId: 8,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-弄潮儿
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/1个", taskType: 1, taskId: 1049, taskTimes: 1, typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 1}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/2个", taskType: 1, taskId: 1050, taskTimes: 2, typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 2}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/3个", taskType: 1, taskId: 1051, taskTimes: 3, typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 3}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/5个", taskType: 1, taskId: 1052, taskTimes: 5, typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 5}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/8个", taskType: 1, taskId: 1053, taskTimes: 8, typeId: 9,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 8}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/10个", taskType: 1, taskId: 1054, taskTimes: 10, typeId: 9,
        taskPrizes: {propId: 1126, number: 1, type: 4}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10}, liveness: 5},

      // 对局成就-高处不胜寒
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/10次", taskType: 2, taskId: 1055, taskTimes: 10, typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 10}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/30次", taskType: 2, taskId: 1056, taskTimes: 30, typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 30}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/50次", taskType: 2, taskId: 1057, taskTimes: 50, typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 50}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/68次", taskType: 2, taskId: 1058, taskTimes: 68, typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 68}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/88次", taskType: 2, taskId: 1059, taskTimes: 88, typeId: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 88}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/100次", taskType: 2, taskId: 1060, taskTimes: 100, typeId: 10,
        taskPrizes: {propId: 1106, number: 1, type: 4}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100}, liveness: 15},

      // 对局成就-嘎嘎乱杀
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/10局首次胡牌就清空三个对手", taskType: 2, taskId: 1061, taskTimes: 10, typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 10}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/30局首次胡牌就清空三个对手", taskType: 2, taskId: 1062, taskTimes: 30, typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 30}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/50局首次胡牌就清空三个对手", taskType: 2, taskId: 1063, taskTimes: 50, typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 50}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/68局首次胡牌就清空三个对手", taskType: 2, taskId: 1064, taskTimes: 68, typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 68}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/88局首次胡牌就清空三个对手", taskType: 2, taskId: 1065, taskTimes: 88, typeId: 11,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 88}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/100局首次胡牌就清空三个对手", taskType: 2, taskId: 1066, taskTimes: 100, typeId: 11,
        taskPrizes: {propId: 1121, number: 1, type: 4}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100}, liveness: 10},

      // 对局成就-禁止划水
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/10局", taskType: 2, taskId: 1067, taskTimes: 10, typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 10}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/30局", taskType: 2, taskId: 1068, taskTimes: 30, typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 30}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/50局", taskType: 2, taskId: 1069, taskTimes: 50, typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 50}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/68局", taskType: 2, taskId: 1070, taskTimes: 68, typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 68}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/88局", taskType: 2, taskId: 1071, taskTimes: 88, typeId: 12,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 88}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/100局", taskType: 2, taskId: 1072, taskTimes: 100, typeId: 12,
        taskPrizes: {propId: 1120, number: 1, type: 4}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100}, liveness: 5},

      // 对局成就-快枪手
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/10局", taskType: 2, taskId: 1073, taskTimes: 10, typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 10}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/30局", taskType: 2, taskId: 1074, taskTimes: 30, typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 30}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/50局", taskType: 2, taskId: 1075, taskTimes: 50, typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 50}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/68局", taskType: 2, taskId: 1076, taskTimes: 68, typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 68}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/88局", taskType: 2, taskId: 1077, taskTimes: 88, typeId: 13,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 88}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/100局", taskType: 2, taskId: 1078, taskTimes: 100, typeId: 13,
        taskPrizes: {propId: 1119, number: 1, type: 4}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100}, liveness: 10},

      // 对局成就-疯狂屠夫
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/10人", taskType: 2, taskId: 1079, taskTimes: 10, typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 10}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/30人", taskType: 2, taskId: 1080, taskTimes: 30, typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 30}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/50人", taskType: 2, taskId: 1081, taskTimes: 50, typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 50}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/68人", taskType: 2, taskId: 1082, taskTimes: 68, typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 68}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/88人", taskType: 2, taskId: 1083, taskTimes: 88, typeId: 14,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 88}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/100人", taskType: 2, taskId: 1084, taskTimes: 100, typeId: 14,
        taskPrizes: {propId: 1109, number: 1, type: 4}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100}, liveness: 10},

      // 对局成就-回村的诱惑
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/10次", taskType: 2, taskId: 1085, taskTimes: 10, typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 10}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/30次", taskType: 2, taskId: 1086, taskTimes: 30, typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 30}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/50次", taskType: 2, taskId: 1087, taskTimes: 50, typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 50}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/68次", taskType: 2, taskId: 1088, taskTimes: 68, typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 68}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/88次", taskType: 2, taskId: 1089, taskTimes: 88, typeId: 15,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 88}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/100次", taskType: 2, taskId: 1090, taskTimes: 100, typeId: 15,
        taskPrizes: {propId: 1108, number: 1, type: 4}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100}, liveness: 5},

      // 对局成就-决胜千里
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/10局", taskType: 2, taskId: 1091, taskTimes: 10, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/30局", taskType: 2, taskId: 1092, taskTimes: 30, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/50局", taskType: 2, taskId: 1093, taskTimes: 50, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/68局", taskType: 2, taskId: 1094, taskTimes: 68, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/88局", taskType: 2, taskId: 1095, taskTimes: 88, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "决胜千里", taskDescribe: "累计胜利对局次数达到?/100局", taskType: 2, taskId: 1096, taskTimes: 100, typeId: 16,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},

      // 对局成就-赛诸葛
      {taskName: "赛诸葛", taskDescribe: "对局连胜达到?/15局", taskType: 2, taskId: 1097, taskTimes: 15, typeId: 17,
        taskPrizes: {propId: 1107, number: 1, type: 4}, taskDesignates: {title: "赛诸葛", propId: 1107, taskTimes: 15}, liveness: 15},

      // 对局成就-散财童子
      {taskName: "散财童子", taskDescribe: "对局结算时输豆数量达到?/999亿", taskType: 2, taskId: 1098, taskTimes: 99900000000, typeId: 18,
        taskPrizes: {propId: 1105, number: 1, type: 4}, taskDesignates: {title: "散财童子", propId: 1105, taskTimes: 99900000000}, liveness: 15},

      // 对局成就-收割机器
      {taskName: "收割机器", taskDescribe: "对局结算时赢豆数量达到?/999亿", taskType: 2, taskId: 1099, taskTimes: 99900000000, typeId: 19,
        taskPrizes: {propId: 1104, number: 1, type: 4}, taskDesignates: {title: "收割机器", propId: 1104, taskTimes: 99900000000}, liveness: 15},

      // 玩法成就-天选之人
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/10次", taskType: 3, taskId: 1100, taskTimes: 10, typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 10}, liveness: 5},
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/30次", taskType: 3, taskId: 1101, taskTimes: 30, typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 30}, liveness: 5},
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/50次", taskType: 3, taskId: 1102, taskTimes: 50, typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 50}, liveness: 5},
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/68次", taskType: 3, taskId: 1103, taskTimes: 68, typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 68}, liveness: 5},
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/88次", taskType: 3, taskId: 1104, taskTimes: 88, typeId: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 88}, liveness: 5},
      {taskName: "天选之人", taskDescribe: "累计天胡次数达到?/100次", taskType: 3, taskId: 1105, taskTimes: 100, typeId: 20,
        taskPrizes: {propId: 1115, number: 1, type: 4}, taskDesignates: {title: "天选之人", propId: 1115, taskTimes: 100}, liveness: 5},

      // 玩法成就-潘达守护者
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/10次", taskType: 3, taskId: 1106, taskTimes: 10, typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 10}, liveness: 5},
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/30次", taskType: 3, taskId: 1107, taskTimes: 30, typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 30}, liveness: 5},
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/50次", taskType: 3, taskId: 1108, taskTimes: 50, typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 50}, liveness: 5},
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/68次", taskType: 3, taskId: 1109, taskTimes: 68, typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 68}, liveness: 5},
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/88次", taskType: 3, taskId: 1110, taskTimes: 88, typeId: 21,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 88}, liveness: 5},
      {taskName: "潘达守护者", taskDescribe: "累计胡四节高达到?/100次", taskType: 3, taskId: 1111, taskTimes: 100, typeId: 21,
        taskPrizes: {propId: 1113, number: 1, type: 4}, taskDesignates: {title: "潘达守护者", propId: 1113, taskTimes: 100}, liveness: 5},

      // 玩法成就-落地成盒
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/10次", taskType: 3, taskId: 1112, taskTimes: 10, typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 10}, liveness: 5},
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/30次", taskType: 3, taskId: 1113, taskTimes: 30, typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 30}, liveness: 5},
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/50次", taskType: 3, taskId: 1114, taskTimes: 50, typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 50}, liveness: 5},
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/68次", taskType: 3, taskId: 1115, taskTimes: 68, typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 68}, liveness: 5},
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/88次", taskType: 3, taskId: 1116, taskTimes: 88, typeId: 22,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 88}, liveness: 5},
      {taskName: "落地成盒", taskDescribe: "累计被天胡破产达到?/100次", taskType: 3, taskId: 1117, taskTimes: 100, typeId: 22,
        taskPrizes: {propId: 1112, number: 1, type: 4}, taskDesignates: {title: "落地成盒", propId: 1112, taskTimes: 100}, liveness: 5},

      // 玩法成就-春风得意
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/10次", taskType: 3, taskId: 1118, taskTimes: 10, typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 10}, liveness: 5},
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/30次", taskType: 3, taskId: 1119, taskTimes: 30, typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 30}, liveness: 5},
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/50次", taskType: 3, taskId: 1120, taskTimes: 50, typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 50}, liveness: 5},
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/68次", taskType: 3, taskId: 1121, taskTimes: 68, typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 68}, liveness: 5},
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/88次", taskType: 3, taskId: 1122, taskTimes: 88, typeId: 23,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 88}, liveness: 5},
      {taskName: "春风得意", taskDescribe: "单局摸到6星座牌达到?/100次", taskType: 3, taskId: 1123, taskTimes: 100, typeId: 23,
        taskPrizes: {propId: 1114, number: 1, type: 4}, taskDesignates: {title: "春风得意", propId: 1114, taskTimes: 100}, liveness: 5},

      // 玩法成就-幸运之星
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/10次", taskType: 3, taskId: 1124, taskTimes: 10, typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 10}, liveness: 5},
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/30次", taskType: 3, taskId: 1125, taskTimes: 30, typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 30}, liveness: 5},
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/50次", taskType: 3, taskId: 1126, taskTimes: 50, typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 50}, liveness: 5},
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/68次", taskType: 3, taskId: 1127, taskTimes: 68, typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 68}, liveness: 5},
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/88次", taskType: 3, taskId: 1128, taskTimes: 88, typeId: 24,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 88}, liveness: 5},
      {taskName: "幸运之星", taskDescribe: "累计杠上开花次数达到?/100次", taskType: 3, taskId: 1129, taskTimes: 100, typeId: 24,
        taskPrizes: {propId: 1111, number: 1, type: 4}, taskDesignates: {title: "幸运之星", propId: 1111, taskTimes: 100}, liveness: 5},

      // 玩法成就-人生如梦
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/10次", taskType: 3, taskId: 1130, taskTimes: 10, typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 10}, liveness: 5},
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/30次", taskType: 3, taskId: 1131, taskTimes: 30, typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 30}, liveness: 5},
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/50次", taskType: 3, taskId: 1132, taskTimes: 50, typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 50}, liveness: 5},
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/68次", taskType: 3, taskId: 1133, taskTimes: 68, typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 68}, liveness: 5},
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/88次", taskType: 3, taskId: 1134, taskTimes: 88, typeId: 25,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 88}, liveness: 5},
      {taskName: "人生如梦", taskDescribe: "对局中因海底捞月或者妙手回春由输转赢达到?/100次", taskType: 3, taskId: 1135, taskTimes: 100, typeId: 25,
        taskPrizes: {propId: 1110, number: 1, type: 4}, taskDesignates: {title: "人生如梦", propId: 1110, taskTimes: 100}, liveness: 5},

      // 特殊成就-财富达人
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/10次", taskType: 4, taskId: 1136, taskTimes: 10, typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 10}, liveness: 5},
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/30次", taskType: 4, taskId: 1137, taskTimes: 30, typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 30}, liveness: 5},
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/50次", taskType: 4, taskId: 1138, taskTimes: 50, typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 50}, liveness: 5},
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/68次", taskType: 4, taskId: 1139, taskTimes: 68, typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 68}, liveness: 5},
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/88次", taskType: 4, taskId: 1140, taskTimes: 88, typeId: 26,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 88}, liveness: 5},
      {taskName: "财富达人", taskDescribe: "在商城用钻石兑换金豆达到?/100次", taskType: 4, taskId: 1141, taskTimes: 100, typeId: 26,
        taskPrizes: {propId: 1123, number: 1, type: 4}, taskDesignates: {title: "财富达人", propId: 1123, taskTimes: 100}, liveness: 5},

      // 特殊成就-贵族专业户
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/1次", taskType: 4, taskId: 1142, taskTimes: 1, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/3次", taskType: 4, taskId: 1143, taskTimes: 3, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/5次", taskType: 4, taskId: 1144, taskTimes: 5, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/8次", taskType: 4, taskId: 1145, taskTimes: 8, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/10次", taskType: 4, taskId: 1146, taskTimes: 10, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族专业户", taskDescribe: "累计购买周卡/月卡达到?/20次", taskType: 4, taskId: 1147, taskTimes: 20, typeId: 27,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},

      // 特殊成就-豪气冲天
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/1次", taskType: 4, taskId: 1148, taskTimes: 1, typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 1}, liveness: 5},
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/3次", taskType: 4, taskId: 1149, taskTimes: 3, typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 3}, liveness: 5},
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/5次", taskType: 4, taskId: 1150, taskTimes: 5, typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 5}, liveness: 5},
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/8次", taskType: 4, taskId: 1151, taskTimes: 8, typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 8}, liveness: 5},
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/10次", taskType: 4, taskId: 1152, taskTimes: 10, typeId: 28,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 10}, liveness: 5},
      {taskName: "豪气冲天", taskDescribe: "对局中购买/兑换礼包次数累计达到?/20次", taskType: 4, taskId: 1153, taskTimes: 20, typeId: 28,
        taskPrizes: {propId: 1116, number: 1, type: 4}, taskDesignates: {title: "豪气冲天", propId: 1116, taskTimes: 20}, liveness: 5},

      // 特殊成就-左右逢源
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/1次", taskType: 4, taskId: 1154, taskTimes: 1, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/3次", taskType: 4, taskId: 1155, taskTimes: 3, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/5次", taskType: 4, taskId: 1156, taskTimes: 5, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/8次", taskType: 4, taskId: 1157, taskTimes: 8, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/10次", taskType: 4, taskId: 1158, taskTimes: 10, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "左右逢源", taskDescribe: "累计领取商城每日暖心福利达到?/20次", taskType: 4, taskId: 1159, taskTimes: 20, typeId: 29,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
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
}
