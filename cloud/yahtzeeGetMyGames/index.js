// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, type, skip, pageLength } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();
  const _ = db.command;

  // 查找所有包含此玩家的，并满足筛选条件的游戏
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  const endQuery = type === "history" ? true : _.neq(true);
  const list = await db
    .collection("yahtzee_games")
    .where({
      "players.openid": OPENID,
      end: endQuery,
    })
    .orderBy("endTime", "desc")
    .orderBy("_createTime", "desc")
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
};
