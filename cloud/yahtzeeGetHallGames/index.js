// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, skip, pageLength } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();
  const _ = db.command;

  // 查找所有符合条件的游戏
  const TREE_HOURS = 3 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - TREE_HOURS);
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);
  const list = await db
    .collection("yahtzee_games")
    .where(
      _.and([
        // 最近3小时的
        {
          _updateTime: _.gt(TIME),
        },
        _.or([
          // 未开始的
          {
            start: _.neq(true),
          },
          // 或已经开始的、未结束的、多人游戏
          {
            end: _.neq(true),
            "players.1": _.exists(1),
          },
        ]),
      ])
    )
    .orderBy("_updateTime", "desc")
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
};
