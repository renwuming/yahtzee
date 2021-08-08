// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, skip, pageLength } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();
  const _ = db.command;

  // 查找所有【最近3小时】【未结束的】游戏
  const TREE_HOURS = 3 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - TREE_HOURS);
  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);
  const list = await db
    .collection("yahtzee_games")
    .where({
      _updateTime: _.gt(TIME),
      end: _.neq(true),
    })
    .orderBy("_updateTime", "desc")
    .skip(_skip)
    .limit(_pageLength)
    .get()
    .then((res) => res.data);

  return list;
};
