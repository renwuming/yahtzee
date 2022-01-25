const cloud = require("wx-server-sdk");

exports.updatePlayer = function (players, gameName, rankList) {
  // 按照游戏名次，更新赛季积分数据
  if (rankList) {
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
async function handleSeasonRankData(players, rankList) {
  const playerSum = players.length;
  if (playerSum < 2) return;
  const db = cloud.database();
  const _ = db.command;

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
