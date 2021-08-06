// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, type } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  // 查找所有满足筛选条件的游戏
  if (type === "score") {
    const list = await db
      .collection("players")
      .orderBy("highScore", "desc")
      .limit(50)
      .get()
      .then((res) => res.data);

    return list;
  } else if (type === "sum") {
    const list = await db
      .collection("players")
      .orderBy("multiWinSum", "desc")
      .limit(50)
      .get()
      .then((res) => res.data);

    return list;
  }

  return [];
};
