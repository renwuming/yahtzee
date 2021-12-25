// 云函数入口文件
const cloud = require("wx-server-sdk");

const DICE_NUM = 4;
const WIN_ROAD_NUM = 3;
const MAX_PLAYERS = 4;
const DEFAULT_PROGRESS = new Array(13).fill(0);
// 云函数入口函数
exports.main = async (event) => {
  const { env, id, action, data } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();

  // 先读旧数据
  const { _id, ...oldData } = await db
    .collection("cantstop_games")
    .doc(id)
    .get()
    .then((res) => res.data);

  const newData = await handleUpdateData(action, oldData, data, env);

  if (newData) {
    const date = new Date();
    // 增量更新数据
    await db
      .collection("cantstop_games")
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
  const { owner, players, roundPlayer, start, round, roundSum } = oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inRound = openids[roundPlayer] === OPENID;
  const inGame = playerIndex >= 0;
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    players.forEach((player) => {
      player.progress = DEFAULT_PROGRESS;
    });
    const startIndex = Math.floor(Math.random() * players.length);
    const startPlayer = players[startIndex];
    return {
      startTime: new Date(),
      start: true,
      players,
      roundPlayer: startIndex,
      startPlayer: startIndex,
      roundTimeStamp: Date.now(),
      round: newRound(startPlayer),
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
        data: {
          simple: true,
        },
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
    const {
      round: { stage },
    } = oldData;
    if (stage === CantStopStage.Select) return;
    const newRoundData = diceIt();
    return {
      round: newRoundData,
    };
  }
  // 更新爬山进度
  else if (action === "updateProgress" && inRound) {
    const {
      round: { stage },
    } = oldData;
    if (stage === CantStopStage.Dice) return;
    const { list } = data;
    const newRoundData = updateProgress(round, list);
    return {
      round: newRoundData,
    };
  }
  // 结束回合
  else if (action === "endRoundByTimer" || (action === "endRound" && inRound)) {
    const newData = endRound(round, players, roundPlayer, roundSum);
    const endData = judgeEnd(newData.players, roundPlayer);
    if (endData.end) {
      updatePlayer(players, env);
    }
    return {
      ...newData,
      ...endData,
    };
  }

  return null;
}

const CantStopStage = {
  Dice: 1,
  Select: 2,
};

function newRound({ progress }) {
  return {
    stage: CantStopStage.Dice,
    diceList: [],
    roundProgress: progress,
    roundRoad: [],
    roundTimeStamp: Date.now(),
  };
}
function diceIt() {
  const newDiceList = new Array(DICE_NUM)
    .fill(-1)
    .map((_) => Math.ceil(Math.random() * 6));

  return {
    diceList: newDiceList,
    stage: CantStopStage.Select,
  };
}

function updateProgress(round, list) {
  const { roundProgress, roundRoad } = round;
  list.forEach((value) => {
    roundProgress[value]++;
  });
  const newRoundRoad = Array.from(new Set(roundRoad.concat(list)));
  return {
    stage: CantStopStage.Dice,
    roundProgress,
    roundRoad: newRoundRoad,
  };
}

function endRound(round, players, roundPlayer, roundSum) {
  const { stage, roundProgress } = round;
  if (stage === CantStopStage.Dice) {
    players[roundPlayer].progress = roundProgress;
  }
  const newRoundPlayer = getNewRoundPlayerIndex(roundPlayer, players);
  const _round = newRound(players[newRoundPlayer]);
  roundSum++;

  return {
    players,
    round: _round,
    roundPlayer: newRoundPlayer,
    roundSum,
  };
}

function judgeEnd(players, roundPlayer) {
  const { progress } = players[roundPlayer];
  if (!progress) return {};
  const win =
    progress.filter((num, road) => {
      const top = getRoadNum(road);
      return num >= top;
    }).length >= WIN_ROAD_NUM;

  if (win) {
    return {
      winner: roundPlayer,
      end: true,
      endTime: new Date(),
      roundPlayer,
    };
  } else {
    return {};
  }
}

function getRoadNum(road) {
  if (road < 2) return Infinity;
  if (road <= 7) return road * 2 - 1;
  return 27 - road * 2;
}

function getNewRoundPlayerIndex(roundPlayer, players) {
  const L = players.length;
  let newRoundPlayer = (roundPlayer + 1) % L;
  return newRoundPlayer;
}

async function updatePlayer(players, env) {
  players.forEach(async (item) => {
    const { openid } = item;

    // 更新胜率等数据
    const { result: updateData } = await cloud.callFunction({
      name: "updateAchievement",
      data: {
        env,
        id: openid,
        game: "cantstop",
      },
    });

    // 更新用户信息
    cloud.callFunction({
      name: "setPlayer",
      data: {
        env,
        openid,
        data: {
          achievement: {
            cantstop: updateData,
          },
        },
      },
    });
  });
}
