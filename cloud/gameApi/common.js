const cloud = require("wx-server-sdk");

exports.updatePlayer = function (players, gameName) {
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
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
}
