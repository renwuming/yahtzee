import { useShareAppMessage } from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { AtButton, AtModal } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/modal.scss";
import "./index.scss";
import {
  CallCloudFunction,
  forceGetUserProfile,
  getUserProfile,
  navigateTo,
} from "../../utils";
import LoadPage from "../../Components/LoadPage";
import Achievement from "../../Components/Achievement";
import { useState } from "react";

export default function Index() {
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);

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

  function showAchievement() {
    setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  return (
    <View className="home">
      <LoadPage></LoadPage>
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
        <AtButton
          type="secondary"
          onClick={() => {
            showAchievement();
          }}
        >
          成就
        </AtButton>
        <AtButton
          type="secondary"
          onClick={() => {
            forceGetUserProfile();
          }}
        >
          更新头像
        </AtButton>
      </View>
      <AtModal isOpened={isAchievementOpened} onClose={hideAchievement}>
        <Achievement></Achievement>
      </AtModal>
    </View>
  );
}
