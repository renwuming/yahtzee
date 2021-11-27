import Taro, { useDidShow } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtToast } from "taro-ui";
import "./index.scss";
import { initUserInfo, SLEEP } from "../../utils";
import { useEffect, useState } from "react";

interface IProps {
  setUserInfo?: (userInfo: Player) => void;
}

export default function Index({ setUserInfo = () => {} }: IProps) {
  const [isOpened, setOpened] = useState<boolean>(false);

  useDidShow(() => {
    setOpened(true);
    Promise.all([SLEEP(300), initUserInfo()]).then((_) => {
      setOpened(false);
      const userInfo = Taro.getStorageSync("userInfo");
      setUserInfo(userInfo);
    });
    // 请求最新版本小程序
    const updateManager = Taro.getUpdateManager();
    updateManager.onUpdateReady(() => {
      Taro.showModal({
        title: "更新提示",
        content: "新版本已经准备好，是否重启应用？",
        showCancel: false,
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        },
      });
    });
  });

  return (
    <View className="load-page">
      <AtToast isOpened={isOpened} text="加载中..." status="loading"></AtToast>
    </View>
  );
}
