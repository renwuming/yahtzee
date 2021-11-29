// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, id, game } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();
  const openid = id || OPENID;

  if (game === "yahtzee") {
    return await handleYahtzeeAchievement(db, openid);
  } else if (game === "martian") {
    return await handleMartianAchievement(db, openid);
  } else if (game === "cantstop") {
    return await handleCantStopAchievement(db, openid);
  } else if (game === "set") {
    return await handleSetAchievement(db, openid);
  }
};

async function handleYahtzeeAchievement(db, openid) {
  // 查找所有包含此玩家的游戏
  const games = await db
    .collection("yahtzee_games")
    .where({
      "players.openid": openid,
      end: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  const singleGames = games.filter((item) => {
    const { players } = item;
    return players.length === 1;
  });
  const multiGames = games.filter((item) => {
    const { players } = item;
    return players.length > 1;
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

  const highScore = Math.max(maxMultiSum, maxSingleSum);

  const multiWinRateValue =
    multiWinSum === 0 ? 0 : +((multiWinSum / multiNum) * 100).toFixed(0);
  const multiWinRate = `${multiWinRateValue}%`;

  return {
    singleNum,
    maxSingleSum,
    multiNum,
    maxMultiSum,
    multiWinSum,
    multiWinRateValue,
    multiWinRate,
    highScore,
  };
}

async function handleMartianAchievement(db, openid) {
  // 查找所有包含此玩家的游戏
  const games = await db
    .collection("martian_games")
    .where({
      "players.openid": openid,
      end: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  const singleGames = games.filter((item) => {
    const { players } = item;
    return players.length === 1;
  });
  const multiGames = games.filter((item) => {
    const { players } = item;
    return players.length > 1;
  });

  const singleNum = singleGames.length;
  const multiNum = multiGames.length;

  let maxSingleSum = 0;
  let maxMultiSum = 0;
  let multiWinSum = 0;
  let minRoundSum = Infinity;

  singleGames.forEach((item) => {
    maxSingleSum = Math.max(maxSingleSum, item.players[0].sumScore);
    minRoundSum = Math.min(item.roundSum, minRoundSum);
  });

  multiGames.forEach((item) => {
    const { players, winners } = item;
    const index = players.map((item) => item.openid).indexOf(openid);
    const player = players[index];
    const { sumScore } = player;

    maxMultiSum = Math.max(maxMultiSum, sumScore);
    if (winners.includes(index)) multiWinSum++;
  });

  const highScore = Math.max(maxMultiSum, maxSingleSum);

  const multiWinRateValue =
    multiWinSum === 0 ? 0 : +((multiWinSum / multiNum) * 100).toFixed(0);
  const multiWinRate = `${multiWinRateValue}%`;

  return {
    singleNum,
    maxSingleSum,
    multiNum,
    maxMultiSum,
    multiWinSum,
    multiWinRateValue,
    multiWinRate,
    minRoundSum,
    highScore,
  };
}

async function handleCantStopAchievement(db, openid) {
  // 查找所有包含此玩家的游戏
  const games = await db
    .collection("cantstop_games")
    .where({
      "players.openid": openid,
      end: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  const singleGames = games.filter((item) => {
    const { players } = item;
    return players.length === 1;
  });
  const multiGames = games.filter((item) => {
    const { players } = item;
    return players.length > 1;
  });

  const singleNum = singleGames.length;
  const multiNum = multiGames.length;

  let multiWinSum = 0;
  let minRoundSum = Infinity;

  singleGames.forEach((item) => {
    minRoundSum = Math.min(item.roundSum, minRoundSum);
  });

  multiGames.forEach((item) => {
    const { winner, players } = item;
    const index = players.map((item) => item.openid).indexOf(openid);
    if (winner === index) multiWinSum++;
  });

  const multiWinRateValue =
    multiWinSum === 0 ? 0 : +((multiWinSum / multiNum) * 100).toFixed(0);
  const multiWinRate = `${multiWinRateValue}%`;

  return {
    singleNum,
    multiNum,
    multiWinSum,
    multiWinRateValue,
    multiWinRate,
    minRoundSum,
  };
}

async function handleSetAchievement(db, openid) {
  // 查找所有包含此玩家的游戏
  const games = await db
    .collection("set_games")
    .where({
      "players.openid": openid,
      end: true,
    })
    .limit(1000) // TODO 分页查询
    .get()
    .then((res) => res.data);

  const singleGames = games.filter((item) => {
    const { players } = item;
    return players.length === 1;
  });
  const multiGames = games.filter((item) => {
    const { players } = item;
    return players.length > 1;
  });

  const singleNum = singleGames.length;
  const multiNum = multiGames.length;

  let multiWinSum = 0;
  let highScore = 0;
  let bestTime = Infinity;

  singleGames.forEach((item) => {
    const {
      timer,
      players: [player],
      endTime,
      startTime,
    } = item;

    if (timer) {
      highScore = Math.max(player.sumScore, highScore);
      bestTime = Math.min(((endTime || Infinity) - startTime) / 1000, bestTime);
    }
  });

  multiGames.forEach((item) => {
    const { timer, players, winners } = item;

    if (timer) {
      const index = players.map((item) => item.openid).indexOf(openid);
      if (winners.includes(index)) multiWinSum++;
      highScore = Math.max(players[index].sumScore, highScore);
    }
  });

  const multiWinRateValue =
    multiWinSum === 0 ? 0 : +((multiWinSum / multiNum) * 100).toFixed(0);
  const multiWinRate = `${multiWinRateValue}%`;

  const resData = {
    singleNum,
    multiNum,
    multiWinSum,
    multiWinRateValue,
    multiWinRate,
    highScore,
  };

  if (bestTime < 300) {
    resData.bestTime = bestTime;
  }

  return resData;
}
