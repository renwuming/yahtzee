// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, multi } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  // 查找所有满足筛选条件的游戏
  const _ = db.command;
  const list = await db
    .collection("yahtzee_games")
    .where({
      winner: multi ? _.neq(null) : _.eq(null),
      end: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  return handleRanking(list);
};

function handleRanking(games) {
  const topSumScorePlayers = [];
  const playerTopScoreMap = {};
  games.forEach((item) => {
    const { players } = item;
    players.forEach((item) => {
      const { openid, sumScore } = item;
      if (!playerTopScoreMap[openid]) {
        topSumScorePlayers.push(item);
        playerTopScoreMap[openid] = sumScore;
      } else {
        const player = topSumScorePlayers.find(
          (item) => item.openid === openid
        );
        const newSumScore = Math.max(sumScore, player.sumScore);
        player.sumScore = newSumScore;
        playerTopScoreMap[openid] = newSumScore;
      }
    });
  });
  topSumScorePlayers.sort((a, b) => b.sumScore - a.sumScore);
  return topSumScorePlayers;
}
