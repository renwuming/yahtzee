// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  let { env, openid, data } = event;
  cloud.init({
    env: env || "prod-0gjpxr644f6d941d",
  });

  const db = cloud.database();
  const { simple } = data || {};

  // 不存在openid参数则是查询自己的用户信息
  openid = openid || OPENID;
  if (!openid) return;

  // 查询单个
  if (typeof openid === "string") {
    const list = await db
      .collection("players")
      .where({
        openid,
      })
      .get()
      .then((res) => res.data);

    const exists = list.length > 0;
    const data = exists ? list[0] : {};
    if (exists) {
      db.collection("players")
        .where({
          openid,
        })
        .update({
          data: {
            lastOnLine: new Date(),
          },
        });
    }
    return simple ? getSimplePlayer(data) : data;
  }
  // 查询集合
  else if (openid instanceof Array) {
    const list = await db
      .collection("players")
      .where({
        openid: db.command.in(openid),
      })
      .get()
      .then((res) => res.data);

    const idList = list.map((item) => item.openid);

    return openid.map((_openid) => {
      const index = idList.indexOf(_openid);
      return simple ? getSimplePlayer(list[index]) : list[index];
    });
  }
};

function getSimplePlayer(data) {
  const { nickName, avatarUrl, openid, _id } = data;
  return {
    nickName,
    avatarUrl,
    openid,
    _id,
  };
}
