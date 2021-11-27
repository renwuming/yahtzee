// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, type, skip, pageLength } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();
  const _ = db.command;

  // 查找所有包含此玩家的，并满足筛选条件的游戏
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  if (type === "hall") {
    // 查找所有符合条件的游戏
    const TREE_HOURS = 3 * 60 * 60 * 1000;
    const TIME = new Date(Date.now() - TREE_HOURS);
    const _skip = +(skip || 0);
    const _pageLength = +(pageLength || 10);
    const list = await db
      .collection("cantstop_games")
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
  } else {
    const endQuery = type === "history" ? true : _.neq(true);
    const list = await db
      .collection("cantstop_games")
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
};
