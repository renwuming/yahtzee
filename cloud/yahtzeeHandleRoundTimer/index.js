// 云函数入口文件
const cloud = require("wx-server-sdk");

// 使用prod环境
const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });
  const db = cloud.database();
  const _ = db.command;

  const list = await db
    .collection("yahtzee_games")
    .where({
      start: true,
      end: _.neq(true),
      players: _.size(2),
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach(handleRoundTimer);
};

const ROUND_TIME_LIMIT = 65 * 1000;

function handleRoundTimer(game) {
  const { _id, roundTimeStamp, roundPlayer, players } = game;
  const outOfTime = Date.now() - (roundTimeStamp || 0) > ROUND_TIME_LIMIT;

  if (outOfTime) {
    const { scores } = players[roundPlayer];
    // 随机将一个未填写的分数置为0
    const emptyTypes = Object.keys(scores).filter(
      (key) => scores[key] === null
    );
    const random = Math.floor(Math.random() * emptyTypes.length);
    const type = emptyTypes[random];
    scores[type] = 0;

    // 更新分数
    cloud.callFunction({
      name: "yahtzeeUpdateGame",
      data: {
        env: ENV,
        id: _id,
        action: "updateGameScores",
        data: {
          scores,
          lastScoreType: type,
        },
      },
    });
  }
}
