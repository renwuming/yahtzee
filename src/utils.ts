import Taro from "@tarojs/taro";
import { DependencyList, useEffect } from "react";

export const VERSION = "v1.0.7";

const CLOUD_ENV = process.env.CLOUD_ENV;
Taro.cloud.init({
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

export function navigateTo(pagePath: string) {
  Taro.navigateTo({
    url: `/pages/${pagePath}`,
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
  const db = Taro.cloud.database();
  const watcher = db
    .collection("yahtzee_games")
    .doc(id)
    /* @ts-ignore */
    .watch({
      onChange({ docs }: any) {
        onChange(docs[0]);
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
      callback();
      initUserInfo();
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
