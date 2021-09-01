// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  if (!OPENID) return;

  const db = cloud.database();
  const _ = db.command;

  // 先查询是否有未开始的游戏
  const [game] = await db
    .collection("martian_games")
    .where({
      "owner.openid": OPENID,
      start: _.neq(true),
    })
    .limit(1)
    .get()
    .then((res) => res.data);

  if (game) return game;

  const { result: player } = await cloud.callFunction({
    name: "getPlayers",
    data: {
      env,
      openid: OPENID,
    },
  });

  const date = new Date();
  const res = await db.collection("martian_games").add({
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
