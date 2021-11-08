const cloud = require("wx-server-sdk");
const ENV = "prod-0gjpxr644f6d941d";

async function execHandleTimerSet(db) {
  const _ = db.command;
  // 处理所有【开始的】【计时的】游戏
  const list = await db
    .collection("set_games")
    .where({
      start: true,
      end: _.neq(true),
      timer: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach((item) => {
    handleTimerSet(item);
  });
}

function handleTimerSet(game) {
  const TIME_LIMIT = 5 * 60 * 1000;
  const { _id, startTime } = game;
  const outOfTime = Date.now() - +startTime > TIME_LIMIT;
  if (outOfTime) {
    // 结束回合
    cloud.callFunction({
      name: "gameApi",
      data: {
        env: ENV,
        id: _id,
        action: "endByTimer",
        gameDbName: "set_games",
      },
    });
  }
}

module.exports = {
  execHandleTimerSet,
};
