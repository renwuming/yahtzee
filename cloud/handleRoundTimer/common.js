const cloud = require("wx-server-sdk");
const ENV = "prod-0gjpxr644f6d941d";

async function execHandleEmptyGame(db, gameDbName) {
  const _ = db.command;
  // 处理所有【player.length === 0】的游戏
  await db
    .collection(gameDbName)
    .where({
      "players.0": _.exists(0),
    })
    .remove();
}

module.exports = {
  execHandleEmptyGame,
};
