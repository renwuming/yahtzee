import { UserInfo } from "@tarojs/taro";
import { DB } from "../../utils";

export async function getWealthList_Database(): Promise<Wealth[]> {
  const list = await DB.collection("wealth")
    .where({
      online: true,
    })
    .get()
    .then((res) => res.data);

  return list as Wealth[];
}

export async function gainWealth_Database(
  wealthID: string,
  openid: string
): Promise<Player> {
  const { type, amount, refresh } = await DB.collection("wealth")
    .doc(wealthID)
    // @ts-ignore
    .get()
    .then((res) => res.data);

  const _ = DB.command;
  await DB.collection("players")
    .where({
      openid,
    })
    // @ts-ignore
    .update({
      data: {
        [`wealth.${type}`]: _.inc(amount),
        [`wealthRecord.${wealthID}.times`]: _.inc(1),
        [`wealthRecord.${wealthID}.refresh`]: refresh,
      },
    });

  const [userInfo] = await DB.collection("players")
    .where({
      openid,
    })
    .get()
    .then((res) => res.data);
  return userInfo as Player;
}
