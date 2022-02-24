import Taro from "@tarojs/taro";
import { RANKING_LEN } from "../../const";
import { DB } from "../../utils";

export async function applySeasonRank_Database() {
  const { openid } = Taro.getStorageSync("userInfo");

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

export async function getCharmRankList_Database(
  skip: number,
  pageLength: number
): Promise<Player[]> {
  const _: any = DB.command;
  const list = await DB.collection("players")
    .where({
      "gift.receive.rose": _.exists(1),
    })
    .orderBy("gift.receive.rose", "desc")
    .skip(skip)
    .limit(pageLength)
    .get()
    .then((res) => res.data);

  return list as Player[];
}
