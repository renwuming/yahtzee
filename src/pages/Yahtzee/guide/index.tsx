import { View, Image } from "@tarojs/components";
import "./index.scss";

export default function Index() {
  const guideUrl = "https://cdn.renwuming.cn/static/yahtzee/imgs/guide2.jpg";
  return (
    <View className="guide-box">
      <Image mode="aspectFit" className="guide" src={guideUrl}></Image>
    </View>
  );
}
