/**
 * Created by Color on 2016/7/10.
 */
const exportObj = {
  'game/gangBySelf': (player, msg) => {
    player.emit('game/gangBySelf', msg);
  },

  'game/buBySelf': (player, msg) => {
    player.emit('game/buBySelf', msg);
  },

  'game/da': (player, msg) => {
    player.emit('game/da', msg);
  },

  'game/qiaoXiang': (player, msg) => {
    player.emit('game/qiaoXiang', msg);
  },

  'game/gangByOtherDa': (player, msg) => {
    player.emit('game/gangByOtherDa', msg);
  },

  'game/peng': (player, msg) => {
    player.emit('game/peng', msg);
  },

  'game/guo': (player, msg) => {
    player.emit('game/guo', msg);
  },

  'game/hu': (player, msg) => {
    player.emit('game/hu', msg);
  },

  'game/chi': (player, msg) => {
    player.emit('game/chi', msg);
  },

  'game/cancelDeposit': (player) => {
    player.emit('game/cancelDeposit');
  },
};

function addMsg(msgName) {
  exportObj[msgName] = (player, msg) => {
    player.emit(msgName, msg);
  };
}

addMsg('game/gangShangPao');
addMsg('game/gangShangKaiHua');
addMsg('game/gangShangChi');
addMsg('game/gangShangPeng');
addMsg('game/gangShangGangSelf');
addMsg('game/gangShangGang');
addMsg('game/gangShangBu');
addMsg('game/gangShangGuo');
addMsg('game/gangShangKaiHuaGuo');
addMsg('game/buByOtherDa');

addMsg('game/yaoHaiDi');
addMsg('game/buYaoHaiDi');
addMsg('game/haiDiLaoYue');
addMsg('game/haiDiJiePao');
addMsg('game/guoHaiDiPao');
addMsg('game/daHaiDi');
addMsg('game/refreshQuiet');

export default exportObj;

