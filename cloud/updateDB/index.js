// 云函数入口文件
const cloud = require("wx-server-sdk");

const ENV = "prod-0gjpxr644f6d941d";
// 云函数入口函数
exports.main = async (event) => {
  cloud.init({
    env: ENV,
  });
  const db = cloud.database();
  const _ = db.command;

  return; // TODO >>>>>>>>>>>>>>>>

  const ONE_DAYS = 1 * 24 * 60 * 60 * 1000;
  const TIME = new Date(Date.now() - ONE_DAYS);
  const list = await db
    .collection("rummy_games")
    .where({
      // "achievement.set": _.exists(1),
      // _updateTime: _.lt(TIME),
      //       winner: -1,
      end: true,
      // endTime: _.gt(new Date("2022-01-24")),
      rankList: _.exists(0),
    })
    .limit(1000)
    .get()
    .then((res) => res.data);
  // .update({
  //   data: {
  //     "achievement.set": _.remove(),
  //   },
  // });
  // .remove();
  const JokerValue = 30;

  list.forEach((item) => {
    const { _id, players } = item;

    const handValueSumList = players.map((player, index) => {
      const { cardList } = player;
      const valueSum = cardList.reduce((sum, card) => {
        const value = card.value === 0 ? JokerValue : card.value;
        return sum + value;
      }, 0);
      return {
        value: valueSum,
        index,
      };
    });

    const rankList = handValueSumList
      .sort((a, b) => a.value - b.value)
      .map((item) => item.index);

    db.collection("rummy_games")
      .doc(_id)
      .update({
        data: {
          winner: rankList[0],
          rankList,
        },
      });
  });

  return list;
};
