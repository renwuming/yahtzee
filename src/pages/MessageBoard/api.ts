import { PAGE_LEN } from "@/const";
import { DB } from "@/utils";

export async function submitBoardMessage(message) {
  await DB.collection("board_messages").add({
    data: {
      message,
      _createTime: new Date(),
      type: "message",
    },
  });
}

export async function getBoardMessages(
  pageNum: number
): Promise<BoardMessage[]> {
  const _ = DB.command;
  const msgList = await DB.collection("board_messages")
    .where({
      type: "message",
    })
    .orderBy("_createTime", "desc")
    .skip(pageNum * PAGE_LEN)
    .limit(PAGE_LEN)
    .get()
    .then((res) => res.data);
  const openidList = msgList.map((item) => item._openid);
  const playerList = await DB.collection("players")
    .where({
      openid: _.in(openidList),
    })
    .get()
    .then((res) => res.data);

  const list = msgList.map((data) => {
    const { _openid } = data;
    const player = playerList.find((item) => item.openid === _openid);
    return {
      ...data,
      submitter: player,
    };
  });

  return list as BoardMessage[];
}

export async function getNotice(): Promise<string> {
  const [noticeData] = await DB.collection("board_messages")
    .where({
      type: "notice",
    })
    .get()
    .then((res) => res.data);

  return noticeData.message;
}
