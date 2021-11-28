// 云函数入口文件
const cloud = require("wx-server-sdk");

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });
  const db = cloud.database();
  const _ = db.command;

  return; // TODO >>>>>>>>>>>>>>>>

  // 删除旧数据
  const ONE_DAYS = 1 * 24 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - ONE_DAYS);
  const list = await db
    .collection("set_games")
    .where({
      _updateTime: _.lt(TIME),
      end: _.neq(true),
      //       winner: -1,
    })
    // .limit(1000)
    // .get();
    //     .then((res) => res.data);
    // .update({
    //   data: {
    //     maxMultiSum: db.command.remove(),
    //     maxSingleSum: db.command.remove(),
    //     multiWinRateValue: db.command.remove(),
    //   },
    // });
    .remove();

  return list;
};
