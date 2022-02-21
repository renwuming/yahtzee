import Taro from "@tarojs/taro";
import { DependencyList, useCallback, useEffect, useRef } from "react";
import { PAGE_LEN } from "./const";

export const VERSION = "v5.2.4";

export const CLOUD_BASE_URL =
  "cloud://prod-0gjpxr644f6d941d.7072-prod-0gjpxr644f6d941d-1306328214";

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

export const flat = (arr) =>
  arr.reduce((a, b) => a.concat(Array.isArray(b) ? flat(b) : b), []);

export function shuffle(arr) {
  var length = arr.length,
    temp,
    random;
  while (0 != length) {
    random = Math.floor(Math.random() * length);
    length--;
    // swap
    temp = arr[length];
    arr[length] = arr[random];
    arr[random] = temp;
  }
  return arr;
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

export async function getPlayerByOpenid(openid: string) {
  const [player] = (await DB.collection("players")
    .where({
      openid,
    })
    .get()
    .then((res) => res.data)) as Player[];

  return player;
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
export function gotoSetGuide() {
  Taro.navigateToMiniProgram({
    appId: "wx7564fd5313d24844",
    path: "pages/video/video?__preload_=16380298343941&__key_=16380298343942&avid=542623920",
  });
}
export function gotoRummyGuide() {
  Taro.navigateToMiniProgram({
    appId: "wx7564fd5313d24844",
    path: "pages/video/video?__preload_=16402720928313&__key_=16402720928314&avid=29811984",
  });
}

export async function getSeasonRankData(
  game: string,
  pageNum: number
): Promise<{
  name: string;
  list: SeasonRankPlayerData[];
}> {
  const _ = DB.command;
  const [seasonRankData] = await DB.collection("season_ranks")
    .where({
      game,
      start: true,
      end: _.neq(true),
    })
    .orderBy("startTime", "desc")
    .get()
    .then((res) => res.data);

  if (!seasonRankData)
    return {
      name: null,
      list: [],
    };

  const { name, seasonRankList } = seasonRankData;
  const rankList = seasonRankList.slice(
    pageNum * PAGE_LEN,
    (pageNum + 1) * PAGE_LEN
  );
  const openidList = rankList.map((item) => item.openid);
  const playerList = await DB.collection("players")
    .where({
      openid: _.in(openidList),
    })
    .get()
    .then((res) => res.data);

  const list = rankList.map((data) => {
    const { openid, score } = data;
    const player = playerList.find((item) => item.openid === openid);
    const rankImgUrl = getRankImgUrl(score);
    return {
      ...data,
      ...player,
      rankImgUrl,
    };
  });

  return {
    name,
    list,
  };
}

function getRankImgUrl(score) {
  let rankValue = 0;
  if (score < 50) rankValue = 0;
  else if (score < 100) rankValue = 1;
  else if (score < 300) rankValue = 2;
  else if (score < 600) rankValue = 3;
  else if (score < 1000) rankValue = 4;
  else rankValue = 5;
  const rankImgUrl = `https://cdn.renwuming.cn/static/yahtzee/imgs/level${rankValue}.jpg`;
  return rankImgUrl;
}

export async function getSeasonRankDataByOpenid(
  game: string,
  openid: string
): Promise<{ name: string; score: number }> {
  if (!openid) return null;

  const _ = DB.command;
  const [seasonRankData] = await DB.collection("season_ranks")
    .where({
      game,
      start: true,
      end: _.neq(true),
    })
    .orderBy("startTime", "desc")
    .get()
    .then((res) => res.data);

  if (!seasonRankData) return null;
  const { name, seasonRankList } = seasonRankData;
  const { score } = seasonRankList.find((item) => item.openid === openid) || {};

  return {
    name,
    score,
  };
}

export const debounce = (fn, wait, immediate) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) fn.apply(this, args);
    }, wait);
    if (immediate && !timeout) fn.apply(this, [...args]);
  };
};

// 获取用户高清头像url
export function headimgHD(url) {
  if (!url) return url;
  url = url.split("/"); //把头像的路径切成数组 //把大小数值为 46 || 64 || 96 || 132 的转换为0
  const L = url.length;
  if (
    url[L - 1] &&
    (url[L - 1] == 46 ||
      url[L - 1] == 64 ||
      url[L - 1] == 96 ||
      url[L - 1] == 132)
  ) {
    url[L - 1] = 0;
  }

  return url.join("/"); //重新拼接为字符串
}
