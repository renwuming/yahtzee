import { DB } from "../../utils";
import { ChatType, updateChatAction_Database } from "../Chat/api";
import { getSendGiftMsg } from "../Gifts";

export async function updateGiftDeal_Database(
  sender: Player,
  receiver: Player,
  giftType: string,
  price: number,
  gameID: string
) {
  const { openid: senderOpenid, nickName: senderNickName } = sender;
  const { openid: receiverOpenid, nickName: receiverNickName } = receiver;

  const [{ wealth }] = (await DB.collection("players")
    .where({
      openid: senderOpenid,
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
        openid: senderOpenid,
      })
      // @ts-ignore
      .update({
        data: {
          "wealth.gold": _.inc(-price),
          [`gift.send.${giftType}`]: _.inc(1),
          [`gift.sendTo.${giftType}.${receiverOpenid}`]: _.inc(1),
        },
      }),
    DB.collection("players")
      .where({
        openid: receiverOpenid,
      })
      // @ts-ignore
      .update({
        data: {
          [`gift.receive.${giftType}`]: _.inc(1),
          [`gift.receiveFrom.${giftType}.${senderOpenid}`]: _.inc(1),
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
            sender: senderOpenid,
            receiver: receiverOpenid,
            type: giftType,
          }),
        },
      }),
  ]);
  // 发送弹幕
  const message = `${senderNickName} 送给 ${receiverNickName} ${getSendGiftMsg(
    giftType
  )}`;
  updateChatAction_Database(senderOpenid, gameID, message, ChatType.gift);
}
