/**
 * Created by Color on 2016/9/2.
 */
import Enums from './enums';

class Rule {
  ro: any

  constructor(ruleObj: any) {
    if (ruleObj.ruleType) {
      if (ruleObj.ruleType === Enums.ruleType.lobby4Player) {
        ruleObj.playerCount = 4
      } else if (ruleObj.ruleType === Enums.ruleType.lobby3Player) {
        ruleObj.playerCount = 3
      } else if (ruleObj.ruleType === Enums.ruleType.lobby2Player) {
        ruleObj.playerCount = 2
      }
    }

    this.ro = ruleObj;
  }

  get canChi() {
    return true
  }

  get lostLimit(): number {
    if (this.useKun) {
      return 0
    }
    return this.ro.jieSuan === 100 ? -100 : Number.MIN_SAFE_INTEGER
  }

  get share(): boolean {
    return !!this.ro.share
  }

  get ruleType() {
    return this.ro.ruleType || Enums.ruleType.lobby4Player;
  }

  get juShu() {
    return this.ro.juShu
  }

  get useKun() {
    return this.ro.juShu === 'yiKun'
  }


  get initScore() {
    if (this.useKun) {
      return 50
    } else {
      return 0
    }
  }


  get quan() {
    return this.ro.quanShu || 2
  }

  get playerCount() {
    return this.ro.playerCount || 4
  }

  get maiDi() {
    return !!this.ro.diFen
  }

  get maiDiTimes() {
    return 2
  }

  get useCaiShen() {
    return this.ro.useCaiShen
  }

  get feiNiao(): number {
    return this.ro.feiNiao || 0
  }

  get keJiePao(): boolean {
    return this.ro.keJiePao
  }

  get diFen(): number {
    return this.ro.diFen || 1
  }


}
export default Rule;
