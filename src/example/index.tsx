import { View } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";

export default function Index() {
  return (
    <View className="index">
      <AtButton type="primary">I need Taro UI</AtButton>
      <AtButton type="primary" circle>
        支持
      </AtButton>
      <AtButton type="secondary" circle>
        来
      </AtButton>
    </View>
  );
}
