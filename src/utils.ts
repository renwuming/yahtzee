import Taro, { Current } from "@tarojs/taro";
import { ANIMATION_BACKUP_SUM } from "./const";
import { DependencyList, useCallback, useEffect, useRef } from "react";

export const VERSION = "v4.5.0";

const CLOUD_ENV = process.env.CLOUD_ENV;
Taro.cloud.init({
  env: CLOUD_ENV,
});

export const DB = Taro.cloud.database({
  env: CLOUD_ENV,
});

export async function CallCloudFunction(params) {
  const { data } = params;
  params.data = {
    ...data,
    env: CLOUD_ENV,
  };

  const res: any = await Taro.cloud.callFunction(params);
  return res.result;
}

export function navigateTo(pageType: string, pagePath: string) {
  const url = "/pages/" + [pageType, pagePath].filter((e) => e).join("/");
  Taro.navigateTo({
    url,
  });
}

export function useAsyncEffect(
  effect: () => Promise<any>,
  deps?: DependencyList
) {
  useEffect(() => {
    effect();
  }, deps);
}

export function watchDataBase(id: string, onChange) {
  const watcher = DB.collection("yahtzee_games")
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

export function getUserProfile(callback = () => {}) {
  const userInfo = Taro.getStorageSync("userInfo");
  const hasSetUserProfile = userInfo && !isDefaultInfo(userInfo);

  if (!hasSetUserProfile) {
    forceGetUserProfile(callback);
  } else {
    callback();
  }
}

export function isMe(openid): boolean {
  const userInfo = Taro.getStorageSync("userInfo");
  return openid === userInfo.openid;
}

function isDefaultInfo(data) {
  const { nickName, openid } = data;
  const chars = nickName.split("-")[1];
  return chars && openid.indexOf(chars) >= 0;
}

export function forceGetUserProfile(callback = () => {}) {
  Taro.getUserProfile({
    desc: "用于提高用户体验",
    async success({ rawData }) {
      await CallCloudFunction({
        name: "setPlayer",
        data: { data: JSON.parse(rawData) },
      });
      await initUserInfo();
      callback();
    },
    fail() {
      callback();
    },
  });
}

export function SLEEP(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export async function initUserInfo() {
  const data = await CallCloudFunction({
    name: "getPlayers",
    data: {},
  });

  if (data.nickName) {
    Taro.setStorageSync("userInfo", data);
  } else {
    await CallCloudFunction({
      name: "setPlayer",
    });
    await initUserInfo();
  }
}

function getVedio(adUnitId, cb) {
  if (Taro.createRewardedVideoAd) {
    const videoAd = Taro.createRewardedVideoAd({
      adUnitId,
    });
    // 广告加载完成后，回调函数
    videoAd.onLoad(() => {
      const showVedioAd = () => {
        videoAd.show().catch(() => {
          showVedioErrToast();
        });
      };
      cb(videoAd, showVedioAd);
    });
    videoAd.onError((err) => {
      showVedioErrToast();
      console.error("videoAd load error", err);
    });
  } else {
    showVedioErrToast();
  }
}

const adUnitId30 = "adunit-111b066b402c31d0";
const adUnitId15 = "adunit-262b83d77c8a752a";

export function getVedio30(cb) {
  return getVedio(adUnitId30, cb);
}
export function getVedio15(cb) {
  return getVedio(adUnitId15, cb);
}

function showVedioErrToast() {
  Taro.showToast({
    title: "获取广告失败",
    icon: "none",
    duration: 1500,
  });
}

export function useDebounce(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(
    function () {
      current.fn = fn;
    },
    [fn]
  );

  return useCallback(function f(...args) {
    if (current.timer) {
      clearTimeout(current.timer);
    }
    current.timer = setTimeout(() => {
      current.fn(...args);
    }, delay);
  }, dep);
}

export function useThrottle(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(
    function () {
      current.fn = fn;
    },
    [fn]
  );

  return useCallback(function f(...args) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        delete current.timer;
      }, delay);
      current.fn(...args);
    }
  }, dep);
}

export function gotoYahtzeeGuide() {
  Taro.navigateToMiniProgram({
    appId: "wx7564fd5313d24844",
    path: "pages/video/video?__preload_=16338757224551&__key_=16338757224552&avid=582666822",
  });
}
export function gotoMartianGuide() {
  Taro.navigateToMiniProgram({
    appId: "wx7564fd5313d24844",
    path: "pages/video/video?__preload_=16338757224553&__key_=16338757224554&avid=886531668",
  });
}
export function gotoCantStopGuide() {
  Taro.navigateToMiniProgram({
    appId: "wx7564fd5313d24844",
    path: "pages/video/video?__preload_=163387572245513&__key_=163387572245514&avid=929195716",
  });
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
  players: Player[]
) {
  const filterFn = createTimeFilter(lastGiftActionExecTime.current);
  const newList = uniqActionsByCreatedAt(
    list.map((item, index) => ({ index, ...item })).filter(filterFn)
  );
  execGiftAnimations(players, newList, lastGiftActionExecTime);
}

function uniqActionsByCreatedAt(list) {
  const map = new Map();
  list.forEach((item) => {
    const { createdAt } = item;
    map.set(createdAt, item);
  });
  return Array.from(map.keys())
    .map((key) => map.get(key))
    .sort((a, b) => a.createdAt - b.createdAt);
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
  list = list.filter(filterFn);
  if (list.length <= 0) return;
  const [action] = list;
  const { type, sender, receiver, createdAt, index } = action;
  const openids = players.map((item) => item.openid);
  const senderIndex = openids.indexOf(sender);
  const receiverIndex = openids.indexOf(receiver);
  lastGiftActionExecTime.current = createdAt;
  sendGiftAnimate(type, senderIndex, receiverIndex, index, () => {
    execGiftAnimations(players, list, lastGiftActionExecTime);
  });
}

function sendGiftAnimate(
  type,
  senderIndex: number,
  receiverIndex: number,
  giftIndex: number,
  cb
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
