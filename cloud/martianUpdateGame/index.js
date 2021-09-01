// 云函数入口文件
const cloud = require("wx-server-sdk");

const DICE_NUM = 13;
const WIN_SCORE = 25;
const MAX_PLAYERS = 4;
// 云函数入口函数
exports.main = async (event) => {
  const { env, id, action, data } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();

  // 先读旧数据
  const { _id, ...oldData } = await db
    .collection("martian_games")
    .doc(id)
    .get()
    .then((res) => res.data);

  const newData = await handleUpdateData(action, oldData, data, env);

  if (newData) {
    const date = new Date();
    // 增量更新数据
    await db
      .collection("martian_games")
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
  const { owner, players, roundPlayer, start, round, startPlayer, roundSum } =
    oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inRound = openids[roundPlayer] === OPENID;
  const inGame = playerIndex >= 0;
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    players.forEach((player) => {
      player.sumScore = 0;
    });
    const startIndex = Math.floor(Math.random() * players.length);
    return {
      startTime: new Date(),
      start: true,
      players,
      roundPlayer: startIndex,
      startPlayer: startIndex,
      roundTimeStamp: Date.now(),
      round: newRound(),
      roundSum: 0,
    };
  }
  // 加入游戏
  else if (action === "joinGame" && !inGame && players.length < MAX_PLAYERS) {
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
  // 踢出某人
  else if (action === "kickPlayer" && own && !start) {
    const { openid } = data;
    const newPlayers = players.filter((item) => item.openid !== openid);
    return {
      players: newPlayers,
    };
  }
  // 离开游戏
  else if (action === "leaveGame" && inGame && !start) {
    const newPlayers = players.filter((item) => item.openid !== OPENID);
    return {
      players: newPlayers,
    };
  }
  // 掷骰子
  else if (action === "dice" && inRound) {
    const newRoundData = diceIt(round);
    return {
      round: newRoundData,
    };
  }
  // 选择骰子
  else if (action === "select" && inRound) {
    const { value } = data;
    const newRoundData = selectDice(round, value);
    return {
      round: newRoundData,
    };
  }
  // 结束回合
  else if (action === "endRound" && inRound) {
    const newData = endRound(round, players, roundPlayer, roundSum);
    const endData = judgeEnd(newData.players, roundPlayer, startPlayer);
    return {
      ...newData,
      ...endData,
    };
  }
  // 更新玩家在线状态
  else if (action === "updatePlayerOnline" && inGame) {
    const timeStamp = Date.now();
    return {
      [`players.${playerIndex}.timeStamp`]: timeStamp,
    };
  }

  return null;
}

const MartianStage = {
  Dice: 1,
  Select: 2,
};
const MartianDice = {
  ufo: 1,
  chook: 2,
  cow: 3,
  man: 4,
  ufo2: 5,
  tank: 6,
};
const MartianDiceMap = [null, "ufo", "chook", "cow", "man", "ufo", "tank"];

function newRound() {
  return {
    stage: MartianStage.Dice,
    diceNum: DICE_NUM,
    diceList: [],
    tankList: [],
    ufoList: [],
    awardList: [],
  };
}
function diceIt(round) {
  const { diceNum, tankList } = round;

  const list = [];
  for (let index = 0; index < diceNum; index++) {
    const value = Math.ceil(Math.random() * 6);
    list.push(MartianDiceMap[value] === "ufo" ? MartianDice.ufo : value);
  }
  const newTankList = [];
  const diceList = [];
  list.sort().forEach((value) => {
    if (value === MartianDice.tank)
      newTankList.push({
        value,
      });
    else
      diceList.push({
        value,
      });
  });

  return {
    stage: MartianStage.Select,
    diceNum: diceList.length,
    diceList,
    tankList: tankList.concat(newTankList),
  };
}

function selectDice(round, value) {
  const { diceList, ufoList, awardList } = round;
  const newDiceList = diceList.filter((item) => item.value !== value);
  const newList = diceList.filter((item) => item.value === value);

  const newRoundData = {
    stage: MartianStage.Dice,
    diceNum: newDiceList.length,
    diceList: newDiceList,
  };
  if (MartianDiceMap[value] === "ufo") {
    newRoundData.ufoList = ufoList.concat(newList);
  } else {
    newRoundData.awardList = awardList
      .concat(newList)
      .sort(sortMartianDiceList);
  }

  return newRoundData;
}

function endRound(round, players, roundPlayer, roundSum) {
  const score = calculateScore(round);
  players[roundPlayer].sumScore += score;
  const _round = newRound();
  const newRoundPlayer = getNewRoundPlayerIndex(roundPlayer, players);
  roundSum++;

  return {
    players,
    round: _round,
    roundPlayer: newRoundPlayer,
    roundSum,
  };
}

function judgeEnd(players, roundPlayer, startPlayer) {
  const someOneWin = players.some((item) => item.sumScore >= WIN_SCORE);
  const L = players.length;
  const endRoundPlayerIndex = (startPlayer + L - 1) % L;

  if (someOneWin && endRoundPlayerIndex === roundPlayer) {
    const list = players
      .concat()
      .sort((item, item2) => item2.sumScore - item.sumScore);
    let maxScore = 0;
    const winners = [];
    list.forEach(({ sumScore, openid }) => {
      if (sumScore >= maxScore) {
        maxScore = sumScore;
        const openids = players.map((item) => item.openid);
        const index = openids.indexOf(openid);
        winners.push(index);
      }
    });

    return {
      winners,
      end: true,
      endTime: new Date(),
      roundPlayer,
    };
  } else {
    return {};
  }
}

function sortMartianDiceList(a, b) {
  return a.value - b.value;
}
function getKindsNum(list) {
  return Array.from(new Set(list.map((item) => item.value))).length;
}

function calculateScore(round) {
  const { tankList, ufoList, awardList } = round;
  if (tankList.length > ufoList.length) return 0;
  const basicScores = awardList.length;
  const bonus = getKindsNum(awardList) >= 3 ? 3 : 0;
  return basicScores + bonus;
}

function getNewRoundPlayerIndex(roundPlayer, players) {
  const L = players.length;
  let newRoundPlayer = (roundPlayer + 1) % L;
  return newRoundPlayer;
}

// async function updatePlayer(players, env) {
//   players.forEach(async (item) => {
//     const { openid } = item;

//     // 更新胜率等数据
//     const { result: updateData } = await cloud.callFunction({
//       name: "getAchievement",
//       data: {
//         env,
//         id: openid,
//       },
//     });

//     // 更新用户信息
//     cloud.callFunction({
//       name: "setPlayer",
//       data: {
//         env,
//         openid,
//         data: updateData,
//       },
//     });
//   });
// }
