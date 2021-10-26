import { View } from "@tarojs/components";
import { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import { AtButton } from "taro-ui";
import "./index.scss";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    const title = nickName
      ? `${nickName}邀请你来玩欲罢不能！`
      : "永远向上，欲罢不能！";
    return {
      title,
      path: `/pages/CantStop/game/index?id=${id}`,
      imageUrl:
        "https://cdn.renwuming.cn/static/cantstop/imgs/cantstop-share.jpg",
    };
  });

  return <View className="homepage"></View>;
}
