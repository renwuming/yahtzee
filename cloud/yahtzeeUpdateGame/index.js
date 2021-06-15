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
    // 增量更新数据
    await db.collection("yahtzee_games").doc(id).update({
      data: newData,
    });
  }

  return null;
};

async function handleUpdateData(action, oldData, data, env) {
  const { OPENID } = cloud.getWXContext();
  const { owner, players, roundPlayer } = oldData;
  const openids = players.map((item) => item.openid);
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    players.forEach((player) => {
      player.scores = DEFAULT_SCORES;
    });
    return {
      start: true,
      players,
      chances: DICE_CHANCES_NUM,
      diceList: DEFAULT_DICE_LIST,
      roundPlayer: 0,
    };
  }
  // 加入游戏
  else if (action === "joinGame" && !openids.includes(OPENID)) {
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
  // TODO: 验证是否回合中
  else if (action === "updateGame") {
    return data;
  }
  // 更新玩家Scores
  // TODO: 验证是否回合中
  else if (action === "updateGameScores") {
    players[roundPlayer].scores = data;
    const newRoundPlayer = (roundPlayer + 1) % players.length;

    return {
      players,
      roundPlayer: newRoundPlayer,
      chances: DICE_CHANCES_NUM,
      diceList: DEFAULT_DICE_LIST,
    };
  }

  return null;
}
