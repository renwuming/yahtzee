// 云函数入口文件
const cloud = require("wx-server-sdk");

const { findOne, find, increaseRoundTime } = require("./common");
const setHandleFn = require("./set");
const rummyHandleFn = require("./rummy");
const handleFnMap = {
  set_games: setHandleFn,
  rummy_games: rummyHandleFn,
};

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  const { id, action, gameDbName, data } = event;
  cloud.init({
    env: ENV,
  });

  if (!action || !gameDbName) return;

  if (action === "findOne") {
    return await findOne(gameDbName, id);
  } else if (action === "findList") {
    return await find(gameDbName, data);
  } else if (action === "getRanking") {
    return await handleFnMap[gameDbName].getRanking(data);
  } else if (action === "create") {
    return await handleFnMap[gameDbName].create(gameDbName);
  } else if (action === "increaseRoundTime") {
    return await increaseRoundTime(id, gameDbName);
  } else {
    return await handleFnMap[gameDbName].handleGame(
      id,
      action,
      data,
      gameDbName
    );
  }
};
