// 云函数入口文件
const cloud = require("wx-server-sdk");
const ENV = "prod-0gjpxr644f6d941d";

async function execHandleRoundTimerYahtzee(db) {
  const _ = db.command;
  // 处理所有【开始的】【多人的】游戏
  const list = await db
    .collection("yahtzee_games")
    .where({
      start: true,
      end: _.neq(true),
      "players.1": _.exists(1),
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach((item) => {
    try {
      handleRoundTimerYahtzee(item);
    } catch (e) {
      console.error(e);
    }
  });
}

function handleRoundTimerYahtzee(game) {
  const ROUND_TIME_LIMIT = 65 * 1000;

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
        action: "updateGameScoresByTimer",
        data: {
          scores,
          lastScoreType: type,
        },
      },
    });
  }
}

async function execHandleExceptionYahtzee(db) {
  const _ = db.command;
  // 处理【最近1小时的】【未结束的】游戏
  const ONE_HOUR = 1 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - ONE_HOUR);
  const list = await db
    .collection("yahtzee_games")
    .where({
      _updateTime: _.gt(TIME),
      end: _.neq(true),
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  list.forEach((item) => {
    handleExceptionYahtzee(db, item);
  });
}

async function handleExceptionYahtzee(db, game) {
  const _ = db.command;
  const { _id, roundPlayer, players, start } = game;
  const realPlayers = players.filter((item) => item.openid);
  const redundantPlayers = realPlayers.length < players.length;
  const updateData = {};

  // 纠正玩家离开房间后，更新了在线时间戳
  if (redundantPlayers) {
    updateData.players = realPlayers;
  }

  // 纠正玩家没有初始化scores
  if (start) {
    players.forEach((item, index) => {
      if (index >= realPlayers.length) return;
      if (!item.scores) {
        updateData[`players.${index}.scores`] = DEFAULT_SCORES;
      }
      if (!item.sumScore) {
        updateData[`players.${index}.sumScore`] = 0;
      }
    });
  }

  // 纠正在开始游戏的瞬间，玩家离开了房间
  if (start && roundPlayer >= realPlayers.length) {
    updateData.roundPlayer = 0;
  }

  if (Object.keys(updateData).length > 0) {
    await db.collection("yahtzee_games").doc(_id).update({
      data: updateData,
    });
  }
}

module.exports = {
  execHandleRoundTimerYahtzee,
  execHandleExceptionYahtzee,
};
