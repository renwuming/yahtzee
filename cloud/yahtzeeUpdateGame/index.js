// 云函数入口文件
const cloud = require("wx-server-sdk");

const DICE_NUM = 5;
const DICE_CHANCES_NUM = 3;
const DEFAULT_DICE_LIST = new Array(DICE_NUM).fill({
  value: 0,
});
const DEFAULT_SCORES = {
  ones: null,
  twos: null,
  threes: null,
  fours: null,
  fives: null,
  sixes: null,
  sum: null,
  fourOfKind: null,
  fullhouse: null,
  miniStraight: null,
  straight: null,
  fiveOfKind: null,
};

// 云函数入口函数
exports.main = async (event) => {
  const { env, id, action, data } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  // 先读旧数据
  const { _id, ...oldData } = await db
    .collection("yahtzee_games")
    .doc(id)
    .get()
    .then((res) => res.data);

  const newData = await handleUpdateData(action, oldData, data, env);

  if (newData) {
    const date = new Date();
    // 增量更新数据
    await db
      .collection("yahtzee_games")
      .doc(id)
      .update({
        data: {
          ...newData,
          _updateTime: date,
        },
      });
  }

  return null;
};

async function handleUpdateData(action, oldData, data, env) {
  const { OPENID } = cloud.getWXContext();
  const { owner, players, roundPlayer, start } = oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inRound = openids[roundPlayer] === OPENID;
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    players.forEach((player) => {
      player.scores = DEFAULT_SCORES;
      player.sumScore = 0;
    });
    return {
      start: true,
      players,
      chances: DICE_CHANCES_NUM,
      diceList: DEFAULT_DICE_LIST,
      roundPlayer: 0,
      roundTimeStamp: Date.now(),
    };
  }
  // 加入游戏
  else if (
    action === "joinGame" &&
    !openids.includes(OPENID) &&
    players.length <= 1 // 最多二人
  ) {
    // 获取用户数据
    const { result: player } = await cloud.callFunction({
      name: "getPlayers",
      data: {
        env,
        openid: OPENID,
      },
    });
    players.push(player);
    return {
      players,
    };
  }
  // 离开游戏
  else if (action === "leaveGame" && openids.includes(OPENID)) {
    const newPlayers = players.filter((item) => item.openid !== OPENID);
    return {
      players: newPlayers,
    };
  }
  // 更新游戏数据
  else if (action === "updateGame" && inRound) {
    return data;
  }
  // 更新游戏数据-冻结骰子
  else if (action === "freezeDice" && inRound) {
    const { index, freezing } = data;
    return {
      [`diceList.${index}.freezing`]: freezing,
    };
  }
  // 更新玩家Scores
  else if (
    action === "updateGameScoresByTimer" ||
    (action === "updateGameScores" && inRound)
  ) {
    const { scores, lastScoreType } = data;
    players[roundPlayer].scores = scores;
    players[roundPlayer].sumScore = getSumScore(scores);
    players[roundPlayer].lastScoreType = lastScoreType;
    const newRoundPlayer = (roundPlayer + 1) % players.length;
    const end = gameOver(start, players);

    let winner = null;
    if (end) {
      winner = getWinner(players);
      updatePlayer(players, env);
    }

    return {
      players,
      roundPlayer: newRoundPlayer,
      roundTimeStamp: Date.now(),
      chances: DICE_CHANCES_NUM,
      diceList: DEFAULT_DICE_LIST,
      end,
      winner,
    };
  }
  // 更新玩家在线状态
  else if (action === "updatePlayerOnline") {
    if (playerIndex < 0) return;
    const timesStamp = Date.now();
    return {
      [`players.${playerIndex}.timeStamp`]: timesStamp,
    };
  }

  return null;
}

const BONUS_NEED = 63;
const BONUS_SCORE = 35;

function scoresToValues(scores) {
  return Object.keys(scores).map((type) => scores[type]);
}

function sum(values) {
  return values.reduce((sum, item) => sum + item);
}

function getBonusScore(scores) {
  const types = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const bonusScore = sum(types.map((type) => scores[type]));
  return bonusScore;
}

function getSumScore(scores) {
  if (!scores) return 0;
  const bonusScore = getBonusScore(scores);
  const hasBonus = bonusScore >= BONUS_NEED;

  let sumScore = sum(scoresToValues(scores));
  hasBonus && (sumScore += BONUS_SCORE);
  return sumScore;
}

function gameOver(start, players) {
  if (!start || players.length <= 0) return false;
  const scoresList = players.reduce((res, item) => {
    const { scores } = item;
    return res.concat(scoresToValues(scores));
  }, []);
  return scoresList.filter((value) => value === null).length <= 0;
}

function getWinner(players) {
  if (players.length <= 1) return null;
  const { sumScore: sum1 } = players[0];
  const { sumScore: sum2 } = players[1];
  if (sum1 === sum2) return -1;
  else if (sum1 > sum2) return 0;
  else return 1;
}

async function updatePlayer(players, env) {
  players.forEach(async (item) => {
    const { openid } = item;

    // 更新胜率等数据
    const { result: updateData } = await cloud.callFunction({
      name: "getAchievement",
      data: {
        env,
        id: openid,
      },
    });

    // 更新用户信息
    cloud.callFunction({
      name: "setPlayer",
      data: {
        env,
        openid,
        data: updateData,
      },
    });
  });
}
