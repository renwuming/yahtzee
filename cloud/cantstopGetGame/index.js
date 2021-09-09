// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { env, id } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();

  const data = await db
    .collection("cantstop_games")
    .doc(id)
    .get()
    .then((res) => res.data);

  return data;
};
