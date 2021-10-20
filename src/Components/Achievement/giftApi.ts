import { DB } from "../../utils";

export async function updateGiftDeal_Database(
  sender: string,
  receiver: string,
  giftType: string,
  price: number,
  gameID: string
) {
  const [{ wealth }] = (await DB.collection("players")
    .where({
      openid: sender,
    })
    .get()
    .then((res) => res.data)) as Player[];

  const { gold } = wealth || { gold: 0 };
  if (gold < price) {
    throw "金币不足";
  }

  const _ = DB.command;
  await Promise.all([
    DB.collection("players")
      .where({
        openid: sender,
      })
      // @ts-ignore
      .update({
        data: {
          "wealth.gold": _.inc(-price),
          [`gift.send.${giftType}`]: _.inc(1),
          [`gift.sendTo.${giftType}.${receiver}`]: _.inc(1),
        },
      }),
    DB.collection("players")
      .where({
        openid: receiver,
      })
      // @ts-ignore
      .update({
        data: {
          [`gift.receive.${giftType}`]: _.inc(1),
          [`gift.receiveFrom.${giftType}.${sender}`]: _.inc(1),
        },
      }),
    DB.collection("game_events")
      .where({
        gameID,
      })
      // @ts-ignore
      .update({
        data: {
          giftActionList: _.push({
            createdAt: new Date(),
            sender,
            receiver,
            type: giftType,
          }),
        },
      }),
  ]);
}
