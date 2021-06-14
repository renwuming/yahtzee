import { View } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import { navigateTo } from "../../const";

export default function Index() {
  return (
    <View className="home">
      <View className="btn-list">
        <AtButton
          type="primary"
          onClick={() => {
            navigateTo("game");
          }}
        >
          单人游戏
        </AtButton>
        <AtButton type="secondary">多人游戏</AtButton>
      </View>
    </View>
  );
}
