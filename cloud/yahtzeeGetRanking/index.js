// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, type, skip, pageLength } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  if (type === "score") {
    const list = await db
      .collection("players")
      .orderBy("highScore", "desc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        highScore: 1,
        openid: 1,
      })
      .skip(_skip)
      .limit(_pageLength)
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
        openid: 1,
      })
      .skip(_skip)
      .limit(_pageLength)
      .get()
      .then((res) => res.data);

    return list;
  }

  return [];
};
