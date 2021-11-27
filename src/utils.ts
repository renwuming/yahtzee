import Taro from "@tarojs/taro";
import { DependencyList, useCallback, useEffect, useRef } from "react";

export const VERSION = "v4.8.1";

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
