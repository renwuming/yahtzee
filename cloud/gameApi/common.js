const cloud = require("wx-server-sdk");

exports.showAdForScore = async function (gameID, gameDbName) {
  const db = cloud.database();
  const _ = db.command;
  const { OPENID } = cloud.getWXContext();

  const { players, rankList, adScorePlayerList } = await db
    .collection(gameDbName)
    .doc(gameID)
    .get()
    .then((res) => res.data);

  const openidList = players.map((item) => item.openid);
  const playerIndex = openidList.indexOf(OPENID);
  const hasAdScore = (adScorePlayerList || []).includes(playerIndex);
  if (playerIndex < 0 || hasAdScore) return;
  const playerSum = players.length;
  const rank = rankList.indexOf(playerIndex);
  // 补齐扣掉的分数
  const scoreChange = -SeasonRankScoreMap[playerSum][rank];
  if (scoreChange > 0) {
    db.collection(gameDbName)
      .doc(gameID)
      .update({
        data: {
          adScorePlayerList: _.push(playerIndex),
        },
      });
    handleSeasonRankData([players[playerIndex]], null, [scoreChange]);
  }
};

exports.updatePlayer = function (players, gameName, rankList) {
  // 按照游戏名次，更新赛季积分数据
  if (rankList && players.length >= 2) {
    handleSeasonRankData(players, rankList);
  }

  players.forEach(async (item) => {
    const { openid } = item;

    // 更新胜率等数据
    const { result: updateData } = await cloud.callFunction({
      name: "updateAchievement",
      data: {
        id: openid,
        game: gameName,
      },
    });

    // 更新用户信息
    cloud.callFunction({
      name: "setPlayer",
      data: {
        openid,
        data: {
          achievement: {
            [gameName]: updateData,
          },
        },
      },
    });
  });
};

const SeasonRankScoreMap = {
  2: {
    0: 20,
    1: -15,
  },
  3: {
    0: 25,
    1: 10,
    2: -20,
  },
  4: {
    0: 30,
    1: 15,
    2: 0,
    3: -25,
  },
};
async function handleSeasonRankData(players, rankList, scoreList = null) {
  const db = cloud.database();
  const _ = db.command;
  const playerSum = players.length;

  const [seasonRankData] = await db
    .collection("season_ranks")
    .where({
      game: "rummy",
      start: true,
      end: _.neq(true),
    })
    .orderBy("startTime", "desc")
    .get()
    .then((res) => res.data);

  if (!seasonRankData) return;

  const { seasonRankList, _id } = seasonRankData;
  if (rankList) {
    rankList.forEach((playerIndex, rank) => {
      const { openid } = players[playerIndex];
      const data = seasonRankList.find((item) => item.openid === openid);
      const scoreChange = SeasonRankScoreMap[playerSum][rank];
      if (data) {
        data.score += scoreChange;
      } else {
        seasonRankList.push({
          openid,
          score: scoreChange,
        });
      }
    });
  } else if (scoreList) {
    players.forEach((player, index) => {
      const { openid } = player;
      const data = seasonRankList.find((item) => item.openid === openid);
      const scoreChange = scoreList[index];
      if (data) {
        data.score += scoreChange;
      } else {
        seasonRankList.push({
          openid,
          score: scoreChange,
        });
      }
    });
  }

  seasonRankList.sort((a, b) => b.score - a.score);

  // 更新赛季积分数据
  db.collection("season_ranks").doc(_id).update({
    data: {
      seasonRankList,
    },
  });
}

exports.getPlayer = async function (_openid) {
  const { result: player } = await cloud.callFunction({
    name: "getPlayers",
    data: {
      openid: _openid,
      data: {
        simple: true,
      },
    },
  });

  return player;
};

exports.findOne = async function findOne(gameDbName, id) {
  const db = cloud.database();
  const data = await db
    .collection(gameDbName)
    .doc(id)
    .get()
    .then((res) => res.data);
  return data;
};

exports.find = async function find(gameDbName, data) {
  const { type } = data;
  if (type === "hall") {
    return await findHallGames(gameDbName, data);
  } else if (type === "hall-mine") {
    return await findMyGames(gameDbName, data, false);
  } else if (type === "history") {
    return await findMyGames(gameDbName, data, true);
  }
};

async function findHallGames(gameDbName, data) {
  const db = cloud.database();
  const _ = db.command;
  const { skip, pageLength } = data;

  // 查找所有符合条件的游戏
  const TREE_HOURS = 3 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - TREE_HOURS);
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);
  const list = await db
    .collection(gameDbName)
    .where(
      _.and([
        // 最近3小时的，未结束的
        {
          _updateTime: _.gt(TIME),
          end: _.neq(true),
        },
      ])
    )
    .orderBy("_updateTime", "desc")
    .field({
      _id: 1,
      players: 1,
      start: 1,
      end: 1,
      winner: 1,
      winners: 1,
    })
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  // 将玩家所在的房间排在前面
  const { OPENID } = cloud.getWXContext();
  list.sort((a, b) => {
    const { players } = a;
    const { players: players2 } = b;
    const inGame = players.map((e) => e.openid).includes(OPENID);
    const inGame2 = players2.map((e) => e.openid).includes(OPENID);
    if (inGame) return -1;
    else if (inGame2) return 1;
  });
  return list;
}

async function findMyGames(gameDbName, data, end) {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;
  const { skip, pageLength } = data;

  // 查找所有包含此玩家的，并满足筛选条件的游戏
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  const endQuery = end ? true : _.neq(true);
  const list = await db
    .collection(gameDbName)
    .where({
      "players.openid": OPENID,
      end: endQuery,
    })
    .orderBy("endTime", "desc")
    .orderBy("_createTime", "desc")
    .field({
      _id: 1,
      players: 1,
      start: 1,
      end: 1,
      winner: 1,
      winners: 1,
    })
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
}

exports.shuffle = function (arr) {
  var length = arr.length,
    temp,
    random;
  while (0 != length) {
    random = Math.floor(Math.random() * length);
    length--;
    // swap
    temp = arr[length];
    arr[length] = arr[random];
    arr[random] = temp;
  }
  return arr;
};

const flat = (arr) =>
  arr.reduce((a, b) => a.concat(Array.isArray(b) ? flat(b) : b), []);
exports.flat = flat;

// 使用金币增加回合时间
const extraRoundTimePriceMap = [100, 200, 500, 1000];
exports.increaseRoundTime = async function (gameID, gameDbName) {
  const db = cloud.database();
  const _ = db.command;
  const { OPENID } = cloud.getWXContext();
  try {
    const data = await db
      .collection(gameDbName)
      .doc(gameID)
      .get()
      .then((res) => res.data);
    const { players, start, end, roundSum, roundPlayer, extraRoundTime } = data;
    // 如果已经额外增加过时间，则忽略
    if ((extraRoundTime || {})[roundSum]) {
      throw new Error("400-每回合只可以延长时间一次");
    }
    const playerIndex = players.map((item) => item.openid).indexOf(OPENID);
    const inRound = roundPlayer === playerIndex;
    const singlePlayer = players.length === 1;
    if (!start || end || !inRound || singlePlayer) {
      throw new Error("400-不是你的回合，操作失败");
    }
    // 计算价格
    let times =
      ((players[playerIndex].actionRecord || {}).extraRoundTime || 0) + 1;
    let price = extraRoundTimePriceMap[times - 1];
    if (!price) {
      price = extraRoundTimePriceMap[extraRoundTimePriceMap.length - 1];
    }

    // 玩家金币是否充足
    const [player] = await db
      .collection("players")
      .where({
        openid: OPENID,
      })
      .get()
      .then((res) => res.data);
    const {
      wealth: { gold },
    } = player;
    if (!gold || gold < price) {
      throw new Error("400-金币不足");
    }

    // 更新游戏数据和玩家数据
    db.collection(gameDbName)
      .doc(gameID)
      .update({
        data: {
          [`extraRoundTime.${roundSum}`]: true,
          [`players.${playerIndex}.actionRecord.extraRoundTime`]: times,
        },
      });
    db.collection("players")
      .where({
        openid: OPENID,
      })
      .update({
        data: {
          "wealth.gold": _.inc(-price),
        },
      });
  } catch (err) {
    const [errCode, errMsg] = err.message.split("-");
    if (+errCode === 400) {
      return {
        errCode: +errCode,
        errMsg,
      };
    }
  }
};
