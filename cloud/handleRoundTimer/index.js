// 云函数入口文件
const cloud = require("wx-server-sdk");

const {
  execHandleRoundTimerYahtzee,
  execHandleExceptionYahtzee,
} = require("./yahtzee");
const {
  execHandleRoundTimerMartian,
  execHandleExceptionMartian,
} = require("./martian");
const {
  execHandleRoundTimerCantStop,
  execHandleExceptionCantStop,
} = require("./cantstop");
const { execHandleTimerSet, execHandleExceptionSet } = require("./set");

const { execHandleTimerRummy, execHandleExceptionRummy } = require("./rummy");

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });
  const db = cloud.database();

  // 快艇骰子
  execHandleRoundTimerYahtzee(db);
  execHandleExceptionYahtzee(db);
  // 火星骰
  execHandleRoundTimerMartian(db);
  execHandleExceptionMartian(db);
  // 欲罢不能
  execHandleRoundTimerCantStop(db);
  execHandleExceptionCantStop(db);
  // Set
  execHandleTimerSet(db);
  execHandleExceptionSet(db);
  // Rummy
  execHandleTimerRummy(db);
  execHandleExceptionRummy(db);

  // 广告弹幕
  execHandleGamePublicity(db);
};

async function execHandleGamePublicity(db) {
  const _ = db.command;
  const gamePublicitySlogan = {
    createdAt: new Date(),
    message:
      "感谢使用小程序，欢迎添加作者微信 ren-wuming，加入玩家群，组局交流~",
    sender: "oqWgm5fO6WmeIflXZZJusUBmWPB0",
    type: 1,
  };
  db.collection("game_events")
    .where({
      "chatActionList.0": _.exists(0),
    })
    .update({
      data: {
        chatActionList: _.push(gamePublicitySlogan),
      },
    });
}
