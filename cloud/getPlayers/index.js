// 云函数入口文件
const cloud = require("wx-server-sdk");

// 云函数入口函数
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  let { env, openid } = event;
  // 不存在openid参数则是查询自己的用户信息
  openid = openid || OPENID;

  cloud.init({
    env,
  });
  const db = cloud.database();

  // 查询单个
  if (typeof openid === "string") {
    const list = await db
      .collection("players")
      .where({
        openid,
      })
      .get()
      .then((res) => res.data);
    return list.length > 0 ? list[0] : getDefualtPlayer(openid);
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
      if (index >= 0) {
        return list[index];
      } else {
        return getDefualtPlayer(_openid);
      }
    });
  }
};

function getDefualtPlayer(openid) {
  return {
    openid,
    nickName: `玩家-${openid.substr(-4)}`,
    avatarUrl: "https://renwuming.cn/static/jmz/icon.jpg",
  };
}
