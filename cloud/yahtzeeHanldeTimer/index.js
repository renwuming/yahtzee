// 云函数入口文件
const cloud = require("wx-server-sdk");

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });

  const db = cloud.database();
  const _ = db.command;

  // 处理【最近1小时的】【未结束的】游戏
  const TREE_HOURS = 1 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - TREE_HOURS);
  const list = await db
    .collection("yahtzee_games")
    .where({
      _updateTime: _.gt(TIME),
      end: _.neq(true),
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach((item) => {
    handleException(db, item);
  });
};

async function handleException(db, game) {
  const _ = db.command;
  const { _id, roundPlayer, players } = game;
  const realPlayers = players.filter((item) => item.openid);
  const updateData = {};

  // 纠正玩家离开房间后，更新了在线时间戳
  if (realPlayers.length !== players.length) {
    updateData.players = _.pop();
  }

  // 纠正在开始游戏的瞬间，玩家离开了房间
  if (roundPlayer >= realPlayers.length) {
    updateData.roundPlayer = 0;
  }

  if (Object.keys(updateData).length > 0) {
    await db.collection("yahtzee_games").doc(_id).update({
      data: updateData,
    });
  }
}
