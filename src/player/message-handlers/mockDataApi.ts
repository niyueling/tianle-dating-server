
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
import SevenSignPrize from "../../database/models/SevenSignPrize";

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
