// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, data, openid } = event;
  cloud.init({
    env,
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
    data.openid = _openid;
    db.collection("players").add({
      data,
    });
  }
};
