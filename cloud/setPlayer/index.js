// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, data, openid } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();

  const _openid = openid || OPENID;
  // 数据是否存在
  const list = await db
    .collection("players")
    .where({
      openid: _openid,
    })
    .get()
    .then((res) => res.data);

  if (list.length > 0) {
    db.collection("players")
      .where({
        openid: _openid,
      })
      .update({
        data,
      });
  } else {
    db.collection("players").add({
      data: {
        ...getDefualtPlayer(_openid),
        ...data,
      },
    });
  }
};

function getDefualtPlayer(openid) {
  return {
    openid,
    nickName: `玩家-${openid.substr(-4)}`,
    avatarUrl: "https://renwuming.cn/static/jmz/icon.jpg",
    singleNum: 0,
    maxSingleSum: 0,
    multiNum: 0,
    maxMultiSum: 0,
    multiWinSum: 0,
    multiWinRateValue: 0,
    multiWinRate: "0%",
    highScore: 0,
  };
}
