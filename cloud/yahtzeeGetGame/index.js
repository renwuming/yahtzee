// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { env, id } = event;
  cloud.init({
    env,
  });
  const db = cloud.database();

  const data = await db
    .collection("yahtzee_games")
    .doc(id)
    .get()
    .then((res) => res.data);

  return {
    ...data,
    openid: OPENID,
  };
};
