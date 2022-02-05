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
  // 删除超过【72h的】【单人】【未结束】游戏
  execDeleteOutOfTimeGames(db);
};

const GAME_LIST = [
  "yahtzee_games",
  "cantstop_games",
  "martian_games",
  "set_games",
  "rummy_games",
];

async function execDeleteOutOfTimeGames(db) {
  const _ = db.command;
  const THREE_DAYS = 72 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - THREE_DAYS);

  GAME_LIST.forEach(async (gameName) => {
    await db
      .collection(gameName)
      .where({
        _updateTime: _.lt(TIME),
        start: true,
        end: _.neq(true),
        "players.1": _.exists(0),
      })
      .remove();
  });
}
