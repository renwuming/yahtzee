// 云函数入口文件
const cloud = require("wx-server-sdk");

const { execHandleDailyWealthRecord } = require("./wealth");

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });
  const db = cloud.database();

  // 每日福利
  execHandleDailyWealthRecord(db);
};
