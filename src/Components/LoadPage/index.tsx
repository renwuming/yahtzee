import { View } from "@tarojs/components";
import { AtToast } from "taro-ui";
import "taro-ui/dist/style/components/toast.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";
import { initUserInfo, SLEEP } from "../../utils";
import { useState } from "react";

export default function Index() {
  const [isOpened, setOpened] = useState<boolean>(true);

  Promise.all([SLEEP(300), initUserInfo()]).then((_) => {
    setOpened(false);
  });
  return (
    <View className="load-page">
      <AtToast isOpened={isOpened} text="加载中..." status="loading"></AtToast>
    </View>
  );
}
