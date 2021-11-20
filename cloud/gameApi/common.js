const cloud = require("wx-server-sdk");

exports.updatePlayer = function (players, gameName) {
  players.forEach(async (item) => {
    const { openid } = item;

    // 更新胜率等数据
    const { result: updateData } = await cloud.callFunction({
      name: "updateAchievement",
      data: {
        id: openid,
        game: gameName,
      },
    });

    // 更新用户信息
    cloud.callFunction({
      name: "setPlayer",
      data: {
        openid,
        data: {
          achievement: {
            [gameName]: updateData,
          },
        },
      },
    });
  });
};

exports.findOne = async function findOne(gameDbName, id) {
  const db = cloud.database();
  const data = await db
    .collection(gameDbName)
    .doc(id)
    .get()
    .then((res) => res.data);
  return data;
};
