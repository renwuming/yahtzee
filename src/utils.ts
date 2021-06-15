import Taro from "@tarojs/taro";
import { DependencyList, useEffect } from "react";

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
      onError(err) {},
    });

  return watcher;
}

export async function getUserProfile(callback = () => {}) {
  const hasSetUserProfile = Taro.getStorageSync("setUserProfile");

  if (!hasSetUserProfile) {
    Taro.getUserProfile({
      desc: "用于提高用户体验",
      success({ rawData }) {
        CallCloudFunction({
          name: "setPlayer",
          data: { data: JSON.parse(rawData) },
        });
        callback();
      },
      fail() {
        callback();
      },
      complete() {
        Taro.setStorageSync("setUserProfile", true);
      },
    });
  } else {
    callback();
  }
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
  Taro.setStorageSync("userInfo", data);
}
