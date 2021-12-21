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

async function execHandleExceptionSet(db) {
  const _ = db.command;
  // 处理【最近1小时的】【未结束的】游戏
  const ONE_HOUR = 1 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - ONE_HOUR);
  const list = await db
    .collection("set_games")
    .where({
      _updateTime: _.gt(TIME),
      end: _.neq(true),
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach((item) => {
    handleExceptionSet(db, item);
  });
}

async function handleExceptionSet(db, game) {
  const { _id, players, start } = game;
  const realPlayers = players.filter((item) => item && item.openid);
  const gamingPlayers = realPlayers.filter(
    (item) => item.sumScore || item.sumScore === 0
  );
  const redundantPlayers = realPlayers.length < players.length;
  const bugPlayers = start && gamingPlayers.length < players.length;
  const updateData = {};

  // 纠正玩家离开房间后，更新了在线时间戳
  // 纠正在开始游戏的瞬间，玩家进入了房间
  if (bugPlayers || redundantPlayers) {
    realPlayers.forEach((player) => {
      if (!player.sumScore) {
        player.sumScore = 0;
        player.successSum = 0;
        player.failSum = 0;
      }
    });
    updateData.players = realPlayers;
  }

  if (Object.keys(updateData).length > 0) {
    await db.collection("set_games").doc(_id).update({
      data: updateData,
    });
  }
}

module.exports = {
  execHandleTimerSet,
  execHandleExceptionSet,
};
