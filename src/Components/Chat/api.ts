import { ACTION_DELAY } from "@/const";
import { DB, handleOpenid2PlayerData, SLEEP } from "@/utils";
import {
  createTimeFilter,
  uniqActionsByCreatedAt,
  watchEvents_DataBase,
} from "@/utils_api";
import { Current, useDidHide, useDidShow } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";

export async function updateChatAction_Database(
  sender: string,
  gameID: string,
  message: string
) {
  if (!sender || !gameID || !message) {
    throw new Error("参数不合法");
  }

  const _ = DB.command;
  await DB.collection("game_events")
    .where({
      gameID,
    })
    // @ts-ignore
    .update({
      data: {
        chatActionList: _.push({
          createdAt: new Date(),
          sender,
          message,
        }),
      },
    });
}

export async function getDialogueList_Database(gameID: string) {
  const _ = DB.command;
  const [{ chatActionList }] = await DB.collection("game_events")
    .where({
      gameID,
    })
    .get()
    .then((res) => res.data);

  if (!chatActionList) return [];

  const openidList = chatActionList.map((item) => item.sender);
  const playerList = await DB.collection("players")
    .where({
      openid: _.in(openidList),
    })
    .get()
    .then((res) => res.data);

  const list = chatActionList.map((data, index) => {
    const { sender } = data;
    const player = playerList.find((item) => item.openid === sender);
    return {
      id: `dialogue${index}`,
      ...data,
      player,
    };
  });

  return list ?? [];
}

export function useChatApi(id: string, updateBarrageList) {
  const [pageShow, setPageShow] = useState<boolean>(true);
  useDidHide(() => {
    setPageShow(false);
  });
  useDidShow(() => {
    setPageShow(true);
    clearChatAnimate();
  });
  const lastChatActionExecTime = useRef<Date>(
    new Date(Date.now() - ACTION_DELAY)
  );
  const eventCb = useRef(null);
  eventCb.current = (data, updatedFields = []) => {
    const chatActionChange = updatedFields.some((item) =>
      /chatActionList/.test(item)
    );
    const { chatActionList } = data || {};
    if (chatActionChange) {
      execChatActions(
        chatActionList,
        lastChatActionExecTime,
        updateBarrageList
      );
    }
  };
  // 监听数据库变化
  const watcherMap = {
    eventsWatcher: null,
    lastUpdate: new Date(),
  };
  useEffect(() => {
    if (!pageShow || !id) return;
    SLEEP(500).then(() => {
      watchEvents_DataBase(id, eventCb, watcherMap);
    });
    return () => {
      watcherMap.eventsWatcher?.close();
    };
  }, [pageShow, id]);
}

async function execChatActions(
  list: ChatAction[],
  lastChatActionExecTime: React.MutableRefObject<Date>,
  updateBarrageList
) {
  list = uniqActionsByCreatedAt(list);
  const filterFn = createTimeFilter(lastChatActionExecTime.current);
  list = list.filter(filterFn).sort((a, b) => +a.createdAt - +b.createdAt);
  if (list.length <= 0) return;
  lastChatActionExecTime.current = list.slice(-1)[0].createdAt;

  list = await handleOpenid2PlayerData(list, "sender");
  updateBarrageList(list);
  // 同时执行动画队列
  list.forEach((action) => {
    chatAnimate(action);
  });
}

function chatAnimate({ index }: ChatAction) {
  const selector = `#barrage_container .barrage-${index}`;
  // 执行动画
  Current.page.animate(
    selector,
    [
      {
        left: 800 + "px",
        offset: 0,
      },
      {
        left: -300 + "px",
        offset: 1,
      },
    ],
    6000,
    () => {
      Current.page.clearAnimation(selector, () => {});
    }
  );
}

function clearChatAnimate() {
  const selector = "#barrage_container .barrage";
  Current.page.clearAnimation(selector, () => {});
}
