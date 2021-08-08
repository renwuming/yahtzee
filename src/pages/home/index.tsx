import Taro from "@tarojs/taro";
import { useShareAppMessage } from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/modal.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";
import {
  CallCloudFunction,
  forceGetUserProfile,
  getUserProfile,
  navigateTo,
  VERSION,
} from "../../utils";
import LoadPage from "../../Components/LoadPage";
import Player from "../../Components/Player";
import { useState } from "react";

export default function Index() {
  const [userInfo, setUserInfo] = useState<any>(
    Taro.getStorageSync("userInfo")
  );

  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = userInfo;
    const title = nickName
      ? `${nickName}邀请你来快艇骰子！`
      : "快艇骰子，一决高下！";
    return {
      title,
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

  function gotoJmz() {
    Taro.navigateToMiniProgram({
      appId: "wxfe74b714bde12b3f",
    });
  }

  return (
    <View className="home">
      <LoadPage></LoadPage>
      <Image
        className="cover"
        src="http://cdn.renwuming.cn/static/yahtzee/imgs/share.png"
      ></Image>
      <Text className="version">{VERSION}</Text>
      <View className="user-info">
        <Player data={userInfo}></Player>
        <AtIcon
          className="setting"
          value="settings"
          size="18"
          color="#176999"
          onClick={() => {
            forceGetUserProfile(() => {
              const userInfo = Taro.getStorageSync("userInfo");
              setUserInfo(userInfo);
            });
          }}
        ></AtIcon>
      </View>
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
          type="primary"
          onClick={() => {
            navigateTo(`hall/index`);
          }}
        >
          房间大厅
        </AtButton>
        <AtButton
          type="secondary"
          onClick={() => {
            navigateTo(`ranking/index`);
          }}
        >
          排行榜
        </AtButton>
        <AtButton
          circle
          type="secondary"
          onClick={() => {
            gotoJmz();
          }}
        >
          <Image src="https://cdn.renwuming.cn/static/jmz/icon.jpg"></Image>
          截码战
        </AtButton>
      </View>
    </View>
  );
}
