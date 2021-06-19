import { useShareAppMessage } from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import {
  CallCloudFunction,
  getUserProfile,
  initUserInfo,
  navigateTo,
} from "../../utils";

export default function Index() {
  initUserInfo();

  // 设置分享
  useShareAppMessage(() => {
    return {
      title: "快艇骰子，一决高下！",
      path: `/pages/home/index`,
      imageUrl: "http://cdn.renwuming.cn/static/yahtzee/imgs/share.png",
    };
  });

  async function createGame() {
    const { _id } = await CallCloudFunction({
      name: "yahtzeeCreateGame",
    });
    navigateTo(`game/index?id=${_id}`);
  }

  return (
    <View className="home">
      <Image
        className="cover"
        src="http://cdn.renwuming.cn/static/yahtzee/imgs/share.png"
      ></Image>
      <View className="btn-list">
        <AtButton
          type="primary"
          onClick={() => {
            getUserProfile(createGame);
          }}
        >
          开始
        </AtButton>
      </View>
    </View>
  );
}
