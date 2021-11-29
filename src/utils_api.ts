import Taro, {
  Current,
  getCurrentInstance,
  useDidHide,
  useDidShow,
} from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { ACTION_DELAY, ANIMATION_BACKUP_SUM } from "./const";
import { DB, SLEEP } from "./utils";

interface GameApiData {
  id: string;
  gameDbName: string;
  initFn: any;
  gameDataWatchCb: any;
  getGameData: any;
  gameData: AnyGameData;
  setRoundCountDown: any;
  getCountDown: any;
}

export function useGameApi(data: GameApiData) {
  const {
    id,
    gameDbName,
    initFn,
    gameDataWatchCb,
    getGameData,
    gameData,
    setRoundCountDown,
    getCountDown,
  } = data;
  const { players, end } = gameData || {};

  const [pageShow, setPageShow] = useState<boolean>(true);

  useDidHide(() => {
    setPageShow(false);
  });
  useDidShow(() => {
    // 进入页面时初始化数据
    const id = getCurrentInstance()?.router?.params?.id;
    getGameData(id).then((data) => {
      initFn(data);
    });
    setPageShow(true);
  });
  const cb = useRef(null);
  cb.current = gameDataWatchCb;

  const lastGiftActionExecTime = useRef<Date>(
    new Date(Date.now() - ACTION_DELAY)
  );
  const eventCb = useRef(null);
  eventCb.current = (data, updatedFields = []) => {
    const { giftActionList } = data || {};
    if (!giftActionList) return;
    execGiftActions(giftActionList, lastGiftActionExecTime, players);
  };
  // 监听数据库变化
  useEffect(() => {
    if (!pageShow) return;
    let watcher, eventsWatcher;
    SLEEP(500).then(() => {
      watcher = watchDataBase(id, gameDbName, cb);
      eventsWatcher = watchEvents_DataBase(id, eventCb);
    });
    return () => {
      watcher?.close();
      eventsWatcher?.close();
    };
  }, [pageShow]);

  // 游戏未结束时，一直更新在线状态和回合倒计时
  useEffect(() => {
    if (end || !pageShow) return;
    updatePlayerOnline_Database(gameData, gameDbName);
    const timer = setInterval(() => {
      updatePlayerOnline_Database(gameData, gameDbName);
    }, 2000);

    const roundTimer = setInterval(() => {
      const roundCountDown = getCountDown(gameData);
      const showRoundCountDown = (roundCountDown >= 0 ? roundCountDown : 0)
        .toString()
        .padStart(2, "0");
      setRoundCountDown(showRoundCountDown);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(roundTimer);
    };
  }, [end, pageShow, gameData]);
}

async function updatePlayerOnline_Database(game: GameData, gameDbName: string) {
  if (!game) return;
  const { _id, playerIndex, inGame } = game;
  if (!inGame) return;
  const date = new Date();
  const timeStamp = Date.now();
  DB.collection(gameDbName)
    .doc(_id)
    .update({
      data: {
        [`players.${playerIndex}.timeStamp`]: timeStamp,
        _updateTime: date,
      },
    });
}

function watchDataBase(id: string, gameDbName: string, onChange) {
  const watcher = DB.collection(gameDbName)
    .doc(id)
    /* @ts-ignore */
    .watch({
      onChange(data: any) {
        const { docs, docChanges } = data;
        const updatedFields = docChanges?.[0]?.updatedFields || {};
        onChange.current(docs[0], Object.keys(updatedFields));
      },
      onError(err) {
        console.error(err);
      },
    });

  return watcher;
}

// 游戏事件、动画相关
export function watchEvents_DataBase(id: string, onChange) {
  const watcher = DB.collection("game_events")
    .where({
      gameID: id,
    })
    /* @ts-ignore */
    .watch({
      onChange(data: any) {
        const { docs, docChanges } = data;
        const updatedFields = docChanges?.[0]?.updatedFields || {};
        onChange.current(docs[0], Object.keys(updatedFields));
      },
      onError(err) {
        console.error(err);
      },
    });

  return watcher;
}

export function execGiftActions(
  list: GiftAction[],
  lastGiftActionExecTime: React.MutableRefObject<Date>,
  players: Player[] = []
) {
  const newList = uniqActionsByCreatedAt(list);
  execGiftAnimations(players, newList, lastGiftActionExecTime);
}

function uniqActionsByCreatedAt(list: GiftAction[]) {
  const createdMap = new Map();
  const typeMap = new Map();
  list.forEach((item) => {
    const { type, createdAt } = item;
    if (createdMap.get(createdAt)) return;
    createdMap.set(createdAt, true);
    if (typeMap.get(type)) {
      typeMap.get(type).push(item);
    } else {
      typeMap.set(type, [item]);
    }
  });

  return Array.from(typeMap.keys())
    .map((key) => typeMap.get(key))
    .reduce((res, list) => {
      return res.concat(list.map((item, index) => ({ index, ...item })));
    }, []);
}

const createTimeFilter =
  (time) =>
  ({ createdAt }) =>
    createdAt > time;

export function execGiftAnimations(
  players: Player[],
  list: GiftAction[],
  lastGiftActionExecTime: React.MutableRefObject<Date>
) {
  const filterFn = createTimeFilter(lastGiftActionExecTime.current);
  list = list.filter(filterFn).sort((a, b) => +a.createdAt - +b.createdAt);
  if (list.length <= 0) return;
  const openids = players.map((item) => item.openid);
  lastGiftActionExecTime.current = list.slice(-1)[0].createdAt;
  // 同时执行动画队列
  list.forEach((action) => {
    const { type, sender, receiver, index } = action;
    const senderIndex = openids.indexOf(sender);
    const receiverIndex = openids.indexOf(receiver);
    sendGiftAnimate(type, senderIndex, receiverIndex, index);
  });
}

function sendGiftAnimate(
  type,
  senderIndex: number,
  receiverIndex: number,
  giftIndex: number,
  cb = () => {}
) {
  if (senderIndex < 0 || receiverIndex < 0 || senderIndex === receiverIndex)
    return;
  const domIndex = giftIndex % ANIMATION_BACKUP_SUM;
  const selector = `#game-gift-container .${type}-${domIndex}`;
  const start = `#player-${senderIndex}-avatar`;
  const target = `#player-${receiverIndex}-avatar`;
  const query = Taro.createSelectorQuery();
  query.select(start).boundingClientRect();
  query.select(target).boundingClientRect();
  query.exec((res) => {
    const [rect, targetRect] = res;
    const startX = rect.left;
    const startY = rect.top;
    const targetX = targetRect.left;
    const targetY = targetRect.top;
    // 执行动画
    Current.page.animate(
      selector,
      [
        {
          opacity: 0,
          scaleX: 0.7,
          scaleY: 0.7,
          left: startX + "px",
          top: startY + "px",
          ease: "ease",
          offset: 0,
        },
        {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          left: startX + "px",
          top: startY + "px",
          ease: "ease",
          offset: 0.15,
        },
        {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          left: targetX + "px",
          top: targetY + "px",
          ease: "ease",
          offset: 1,
        },
      ],
      1000,
      () => {
        Current.page.clearAnimation(selector, () => {});
        cb();
      }
    );
  });
}
