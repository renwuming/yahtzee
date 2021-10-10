import Taro from "@tarojs/taro";
import { RANKING_LEN } from "../../const";
import { DB } from "../../utils";

const rankMap = { 青铜: 0, 白银: 1, 黄金: 2, 铂金: 3, 钻石: 4, 最强王者: 5 };
const rankLevelMap = {
  青铜: false,
  白银: true,
  黄金: true,
  铂金: true,
  钻石: false,
  最强王者: false,
};

export async function getSeasonRankList_Database(): Promise<SeasonRank> {
  const [data] = await DB.collection("season_ranks")
    .where({
      start: true,
      end: false,
    })
    .get()
    .then((res) => res.data);

  const { list } = data;
  data.list = list
    .sort((a, b) => {
      const { rankType, rankLevel } = a;
      const { rankType: rankType2, rankLevel: rankLevel2 } = b;

      if (!rankType) return 1;
      if (!rankType2) return -1;

      const rankValue = rankMap[rankType] * 10 + +rankLevel;
      const rankValue2 = rankMap[rankType2] * 10 + +rankLevel2;
      return rankValue2 - rankValue;
    })
    .slice(0, RANKING_LEN);

  data.list.forEach((item) => {
    const { rankType, rankLevel } = item;
    const rankValue = rankMap[rankType];
    item.rankImgUrl = `https://cdn.renwuming.cn/static/yahtzee/imgs/level${rankValue}.jpg`;
    item.rankLevel = rankLevelMap[rankType] ? rankLevel : null;
  });

  return data as SeasonRank;
}

export async function applySeasonRank_Database() {
  const { openid } = Taro.getStorageSync("userInfo");

  const _ = DB.command;

  const [userInfo] = await DB.collection("players")
    .where({
      openid,
    })
    .get()
    .then((res) => res.data);

  const [seasonRank] = await DB.collection("season_ranks")
    .where({
      start: true,
      end: false,
    })
    .get()
    .then((res) => res.data);

  if (seasonRank.list.map((item) => item.openid).includes(userInfo.openid)) {
    return;
  } else {
    const { _id } = seasonRank;
    const { nickName, avatarUrl, openid } = userInfo;
    const list = seasonRank.list.concat([
      {
        openid,
        nickName,
        avatarUrl,
        rankLevel: 1,
        rankType: "青铜",
      },
    ]);

    await DB.collection("season_ranks")
      .doc(_id)
      // @ts-ignore
      .update({
        data: {
          list,
        },
      });
  }
}
