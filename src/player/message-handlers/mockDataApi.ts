
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
import HeadBorder from "../../database/models/HeadBorder";
import Medal from "../../database/models/Medal";
import CardTable from "../../database/models/CardTable";

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

  // 录入任务数据
  @addApi()
  async saveTaskData() {
    const result = await BlockTask.find();

    if (result.length) {
      await BlockTask.remove({_id: {$ne: null}}).exec();
    }

    const datas = [
      // 成长成就-钻石王老五
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/88", taskType: 1, taskId: 1001, taskTimes: 88,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/388", taskType: 1, taskId: 1002, taskTimes: 388,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/888", taskType: 1, taskId: 1003, taskTimes: 388,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/2888", taskType: 1, taskId: 1004, taskTimes: 2888,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/5888", taskType: 1, taskId: 1005, taskTimes: 5888,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},
      {taskName: "钻石王老五", taskDescribe: "拥有钻石数大于?/8888", taskType: 1, taskId: 1006, taskTimes: 8888,
        taskPrizes: {propId: 1122, number: 1, type: 4}, taskDesignates: {title: "钻石王老五", propId: 1122, taskTimes: 8888}, liveness: 10},

      // 成长成就-零号玩家
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/7天", taskType: 1, taskId: 1007, taskTimes: 7,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/14天", taskType: 1, taskId: 1008, taskTimes: 14,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/30天", taskType: 1, taskId: 1009, taskTimes: 30,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/58天", taskType: 1, taskId: 1010, taskTimes: 58,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/88天", taskType: 1, taskId: 1011, taskTimes: 88,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},
      {taskName: "零号玩家", taskDescribe: "累计签到天数达到?/100天", taskType: 1, taskId: 1012, taskTimes: 100,
        taskPrizes: {propId: 1118, number: 1, type: 4}, taskDesignates: {title: "零号玩家", propId: 1118, taskTimes: 100}, liveness: 5},

      // 成长成就-久经沙场
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/20局", taskType: 1, taskId: 1013, taskTimes: 20,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/50局", taskType: 1, taskId: 1014, taskTimes: 50,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/99局", taskType: 1, taskId: 1015, taskTimes: 99,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/288局", taskType: 1, taskId: 1016, taskTimes: 288,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/888局", taskType: 1, taskId: 1017, taskTimes: 888,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "久经沙场", taskDescribe: "累计对局次数达到?/1888局", taskType: 1, taskId: 1018, taskTimes: 1888,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-天道酬勤
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/10局", taskType: 1, taskId: 1019, taskTimes: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/20局", taskType: 1, taskId: 1020, taskTimes: 20,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/30局", taskType: 1, taskId: 1021, taskTimes: 30,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/50局", taskType: 1, taskId: 1022, taskTimes: 50,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/68局", taskType: 1, taskId: 1023, taskTimes: 68,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "天道酬勤", propId: 1101, taskTimes: 88}, liveness: 15},
      {taskName: "天道酬勤", taskDescribe: "单日累计对局数达到?/88局", taskType: 1, taskId: 1024, taskTimes: 88,
        taskPrizes: {propId: 1101, number: 1, type: 4}, taskDesignates: {title: "天道酬勤", propId: 1118, taskTimes: 88}, liveness: 15},

      // 成长成就-人生赢家
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/1500万", taskType: 1, taskId: 1025, taskTimes: 15000000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/3000万", taskType: 1, taskId: 1026, taskTimes: 30000000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/5888万", taskType: 1, taskId: 1027, taskTimes: 58880000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/8888万", taskType: 1, taskId: 1028, taskTimes: 88880000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/5亿", taskType: 1, taskId: 1029, taskTimes: 500000000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "人生赢家", taskDescribe: "游戏豆数量达到?/20亿", taskType: 1, taskId: 1030, taskTimes: 2000000000,
        taskPrizes: {name: "50万金豆", number: 500000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-收藏家
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/1个", taskType: 1, taskId: 1031, taskTimes: 1,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 1}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/2个", taskType: 1, taskId: 1032, taskTimes: 2,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 2}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/3个", taskType: 1, taskId: 1033, taskTimes: 3,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 3}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/4个", taskType: 1, taskId: 1034, taskTimes: 4,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 4}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/5个", taskType: 1, taskId: 1035, taskTimes: 5,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "收藏家", propId: 1103, taskTimes: 5}, liveness: 5},
      {taskName: "收藏家", taskDescribe: "累计拥有永久牌桌?/7个", taskType: 1, taskId: 1036, taskTimes: 7,
        taskPrizes: {propId: 1103, number: 1, type: 4}, taskDesignates: {title: "收藏家", propId: 1118, taskTimes: 7}, liveness: 5},

      // 成长成就-颜值担当
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/1个", taskType: 1, taskId: 1037, taskTimes: 1,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 1}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/2个", taskType: 1, taskId: 1038, taskTimes: 2,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 2}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/3个", taskType: 1, taskId: 1039, taskTimes: 3,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 3}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/5个", taskType: 1, taskId: 1040, taskTimes: 5,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 5}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/8个", taskType: 1, taskId: 1041, taskTimes: 8,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 8}, liveness: 5},
      {taskName: "颜值担当", taskDescribe: "累计拥有永久头像框?/10个", taskType: 1, taskId: 1042, taskTimes: 10,
        taskPrizes: {propId: 1102, number: 1, type: 4}, taskDesignates: {title: "颜值担当", propId: 1102, taskTimes: 10}, liveness: 5},

      // 成长成就-贵族气质
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/1级", taskType: 1, taskId: 1043, taskTimes: 1,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/2级", taskType: 1, taskId: 1044, taskTimes: 2,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/3级", taskType: 1, taskId: 1045, taskTimes: 3,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/4级", taskType: 1, taskId: 1046, taskTimes: 4,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/5级", taskType: 1, taskId: 1047, taskTimes: 5,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/6级", taskType: 1, taskId: 1048, taskTimes: 6,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},

      // 成长成就-弄潮儿
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/1个", taskType: 1, taskId: 1049, taskTimes: 1,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 1}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/2个", taskType: 1, taskId: 1050, taskTimes: 2,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 2}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/3个", taskType: 1, taskId: 1051, taskTimes: 3,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 3}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/5个", taskType: 1, taskId: 1052, taskTimes: 5,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 5}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/8个", taskType: 1, taskId: 1053, taskTimes: 8,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 8}, liveness: 5},
      {taskName: "弄潮儿", taskDescribe: "累计拥有永久称号?/10个", taskType: 1, taskId: 1054, taskTimes: 10,
        taskPrizes: {propId: 1126, number: 1, type: 4}, taskDesignates: {title: "弄潮儿", propId: 1126, taskTimes: 10}, liveness: 5},

      // 对局成就-高处不胜寒
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/10次", taskType: 2, taskId: 1055, taskTimes: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 10}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/30次", taskType: 2, taskId: 1056, taskTimes: 30,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 30}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/50次", taskType: 2, taskId: 1057, taskTimes: 50,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 50}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/68次", taskType: 2, taskId: 1058, taskTimes: 68,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 68}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/88次", taskType: 2, taskId: 1059, taskTimes: 88,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 88}, liveness: 15},
      {taskName: "高处不胜寒", taskDescribe: "封顶次数（21万倍以上）达到?/100次", taskType: 2, taskId: 1060, taskTimes: 100,
        taskPrizes: {propId: 1106, number: 1, type: 4}, taskDesignates: {title: "高处不胜寒", propId: 1106, taskTimes: 100}, liveness: 15},

      // 对局成就-嘎嘎乱杀
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/10局首次胡牌就清空三个对手", taskType: 2, taskId: 1061, taskTimes: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 10}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/30局首次胡牌就清空三个对手", taskType: 2, taskId: 1062, taskTimes: 30,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 30}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/50局首次胡牌就清空三个对手", taskType: 2, taskId: 1063, taskTimes: 50,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 50}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/68局首次胡牌就清空三个对手", taskType: 2, taskId: 1064, taskTimes: 68,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 68}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/88局首次胡牌就清空三个对手", taskType: 2, taskId: 1065, taskTimes: 88,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 88}, liveness: 10},
      {taskName: "嘎嘎乱杀", taskDescribe: "累计?/100局首次胡牌就清空三个对手", taskType: 2, taskId: 1066, taskTimes: 100,
        taskPrizes: {propId: 1121, number: 1, type: 4}, taskDesignates: {title: "嘎嘎乱杀", propId: 1121, taskTimes: 100}, liveness: 10},

      // 对局成就-禁止划水
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/10局", taskType: 2, taskId: 1067, taskTimes: 10,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 10}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/30局", taskType: 2, taskId: 1068, taskTimes: 30,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 30}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/50局", taskType: 2, taskId: 1069, taskTimes: 50,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 50}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/68局", taskType: 2, taskId: 1070, taskTimes: 68,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 68}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/88局", taskType: 2, taskId: 1071, taskTimes: 88,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 88}, liveness: 5},
      {taskName: "禁止划水", taskDescribe: "累计流局达到?/100局", taskType: 2, taskId: 1072, taskTimes: 100,
        taskPrizes: {propId: 1120, number: 1, type: 4}, taskDesignates: {title: "禁止划水", propId: 1120, taskTimes: 100}, liveness: 5},

      // 对局成就-快枪手
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/10局", taskType: 2, taskId: 1073, taskTimes: 10,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 10}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/30局", taskType: 2, taskId: 1074, taskTimes: 30,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 30}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/50局", taskType: 2, taskId: 1075, taskTimes: 50,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 50}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/68局", taskType: 2, taskId: 1076, taskTimes: 68,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 68}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/88局", taskType: 2, taskId: 1077, taskTimes: 88,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 88}, liveness: 10},
      {taskName: "快枪手", taskDescribe: "累计对局中最先胡牌达到?/100局", taskType: 2, taskId: 1078, taskTimes: 100,
        taskPrizes: {propId: 1119, number: 1, type: 4}, taskDesignates: {title: "快枪手", propId: 1119, taskTimes: 100}, liveness: 10},

      // 对局成就-疯狂屠夫
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/10人", taskType: 2, taskId: 1079, taskTimes: 10,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 10}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/30人", taskType: 2, taskId: 1080, taskTimes: 30,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 30}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/50人", taskType: 2, taskId: 1081, taskTimes: 50,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 50}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/68人", taskType: 2, taskId: 1082, taskTimes: 68,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 68}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/88人", taskType: 2, taskId: 1083, taskTimes: 88,
        taskPrizes: {name: "10钻石", number: 10, type: 1}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 88}, liveness: 10},
      {taskName: "疯狂屠夫", taskDescribe: "累计使认输人数达到?/100人", taskType: 2, taskId: 1084, taskTimes: 100,
        taskPrizes: {propId: 1109, number: 1, type: 4}, taskDesignates: {title: "疯狂屠夫", propId: 1109, taskTimes: 100}, liveness: 10},

      // 对局成就-回村的诱惑
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/10次", taskType: 2, taskId: 1085, taskTimes: 10,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 10}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/30次", taskType: 2, taskId: 1086, taskTimes: 30,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 30}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/50次", taskType: 2, taskId: 1087, taskTimes: 50,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 50}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/68次", taskType: 2, taskId: 1088, taskTimes: 68,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 68}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/88次", taskType: 2, taskId: 1089, taskTimes: 88,
        taskPrizes: {name: "20万金豆", number: 200000, type: 2}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 88}, liveness: 5},
      {taskName: "回村的诱惑", taskDescribe: "累计对局结束破产次数达到?/100次", taskType: 2, taskId: 1090, taskTimes: 100,
        taskPrizes: {propId: 1108, number: 1, type: 4}, taskDesignates: {title: "回村的诱惑", propId: 1108, taskTimes: 100}, liveness: 5},

      // 对局成就-决胜千里
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/1级", taskType: 1, taskId: 1043, taskTimes: 1,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/2级", taskType: 1, taskId: 1044, taskTimes: 2,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/3级", taskType: 1, taskId: 1045, taskTimes: 3,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/4级", taskType: 1, taskId: 1046, taskTimes: 4,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/5级", taskType: 1, taskId: 1047, taskTimes: 5,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
      {taskName: "贵族气质", taskDescribe: "特权等级达到?/6级", taskType: 1, taskId: 1048, taskTimes: 6,
        taskPrizes: {name: "100万金豆", number: 1000000, type: 2}, taskDesignates: {}, liveness: 5},
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
