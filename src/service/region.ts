import {GameError} from "@fm/common/errors";
import * as mongoose from 'mongoose'
import {RegionModel} from "../database/models/region";
import {RegionGameModel} from "../database/models/regionGame";
import BaseService from "./base";

// 区域
export default class RegionService extends BaseService {

    // 获取默认区域
    async getDefaultGameTypes() {
        const m = await RegionModel.findOne({ city: '南平', county: '浦城县' });
        let gameTypes = [];
        if (m) {
            // 查找游戏类型
            gameTypes = await this.getGameTypesByRegion(m._id);
        }
        return { city: '南平', county: '浦城县', gameTypes }
    }

    // 获取区域
    async mustGetRegion(city, county) {
        const m = await RegionModel.findOne({ city, county });
        if (!m) {
            throw new GameError('无此区域');
        }
        return m;
    }

    async getGameTypesByRegion(regionId) {
        const gameTypes = [];
        // 查找游戏类型
        const games = await this.findGameByRegionId(regionId);
        for (const g of games) {
            gameTypes.push(g.gameName);
        }
        return gameTypes
    }

    // 添加or更新区域
    async addOrUpdateRegion(city, county) {
        let m = await RegionModel.findOne({ city, county });
        if (!m) {
            m = new RegionModel({
                city,
                county,
            });
            await m.save();
        }
        return m;
    }

    // 根据 regionId, 游戏名，删除
    async findGameByRegionId(region) {
        return RegionGameModel.find({ region })
    }

    // 为区域添加游戏
    async addOrUpdateRegionGame(region: mongoose.Types.ObjectId, gameName: string) {
        let m = await RegionGameModel.findOne({ region, gameName });
        if (!m) {
            m = new RegionGameModel({
                region,
                gameName,
            });
            await m.save();
        }
        return m;
    }
}
