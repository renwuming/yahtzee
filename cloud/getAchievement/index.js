// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, id } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  const openid = id || OPENID;

  // 查找所有包含此玩家的游戏
  const list = await db
    .collection("yahtzee_games")
    .where({
      "players.openid": openid,
    })
    .get()
    .then((res) => res.data);

  return handleAchievement(list, openid);
};

function handleAchievement(games, openid) {
  const singleGames = games.filter((item) => {
    const { players, end } = item;
    return end && players.length === 1;
  });
  const multiGames = games.filter((item) => {
    const { players, end } = item;
    return end && players.length > 1;
  });

  const singleNum = singleGames.length;
  const multiNum = multiGames.length;

  let maxSingleSum = 0;
  let maxMultiSum = 0;
  let multiWinSum = 0;

  singleGames.forEach((item) => {
    maxSingleSum = Math.max(maxSingleSum, item.players[0].sumScore);
  });

  multiGames.forEach((item) => {
    const { players, winner } = item;
    const index = players.map((item) => item.openid).indexOf(openid);
    const player = players[index];
    const { sumScore } = player;

    maxMultiSum = Math.max(maxMultiSum, sumScore);
    if (winner === index) multiWinSum++;
  });

  const multiWinRate = `${
    multiWinSum === 0 ? 0 : ((multiWinSum / multiNum) * 100).toFixed(0)
  }%`;

  return {
    singleNum,
    maxSingleSum,
    multiNum,
    maxMultiSum,
    multiWinSum,
    multiWinRate,
  };
}
