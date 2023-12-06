/**
 * Created by user on 2016-07-06.
 */
import TableState from './mj_hunan/table_state';
import Rule from './mj_hunan/Rule';

class Game {
  constructor(ruleObj) {
    this.rule = new Rule(ruleObj);
    this.juIndex = 0;
    this.juShu = this.rule.juShu;
  }

  startGame(room) {
    if (!room.isPublic) {
      this.juShu--;
      this.juIndex++;
    }
    return new TableState(room, this.rule, this.juShu, this.juIndex);
  }
}

export default Game;

