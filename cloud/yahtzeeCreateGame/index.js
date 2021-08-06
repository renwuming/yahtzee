// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  const { result: player } = await cloud.callFunction({
    name: "getPlayers",
    data: {
      env,
      openid: OPENID,
    },
  });

  const date = new Date();
  const res = await db.collection("yahtzee_games").add({
    data: {
      start: false,
      owner: player,
      players: [player],
      _createTime: date,
      _updateTime: date,
    },
  });

  return res;
};
