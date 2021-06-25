// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, id, end, skip, pageLength } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  const openid = id || OPENID;

  // 查找所有包含此玩家的，并满足筛选条件的游戏
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 0);
  const list = await db
    .collection("yahtzee_games")
    .where({
      "players.openid": openid,
      end,
    })
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
};
