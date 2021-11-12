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
};
