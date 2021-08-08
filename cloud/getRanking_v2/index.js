// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, type } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  if (type === "score") {
    const list = await db
      .collection("players")
      .orderBy("highScore", "desc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        highScore: 1,
      })
      .limit(50)
      .get()
      .then((res) => res.data);

    return list;
  } else if (type === "sum") {
    const list = await db
      .collection("players")
      .orderBy("multiWinSum", "desc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        multiWinSum: 1,
      })
      .limit(50)
      .get()
      .then((res) => res.data);

    return list;
  }

  return [];
};
