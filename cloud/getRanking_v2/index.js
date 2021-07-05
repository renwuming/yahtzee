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
  const list = await db
    .collection("players")
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  return handleRanking(list, type);
};

function handleRanking(players, type) {
  if (type === "score") {
    return players
      .sort((a, b) => {
        return b.highScore - a.highScore;
      })
      .slice(0, 50);
  } else if (type === "winRate") {
    return players
      .filter((item) => item.multiNum >= 10)
      .sort((a, b) => {
        if (a.multiWinRateValue !== b.multiWinRateValue) {
          return b.multiWinRateValue - a.multiWinRateValue;
        } else {
          return b.multiNum - a.multiNum;
        }
      })
      .slice(0, 50);
  } else if (type === "sum") {
    return players
      .sort((a, b) => {
        return b.multiNum + b.singleNum - (a.multiNum + a.singleNum);
      })
      .slice(0, 50);
  }
}
