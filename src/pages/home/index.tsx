import Taro from "@tarojs/taro";
import { useShareAppMessage } from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/modal.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";
// @ts-ignore
import YahtzeeLogoImg from "../../assets/imgs/yahtzee-share.png";
// @ts-ignore
import MartianLogoImg from "../../assets/imgs/martian-share.jpg";
// @ts-ignore
import CoverImg from "../../assets/imgs/cover.jpg";
import {
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
    const title = "骰子桌游大全，各种骰子游戏，快来玩吧！";
    return {
      title,
      path: `/pages/home/index`,
      imageUrl: "https://cdn.renwuming.cn/static/yahtzee/imgs/cover.jpg",
    };
  });

  function gotoJmz() {
    Taro.navigateToMiniProgram({
      appId: "wxfe74b714bde12b3f",
    });
  }

  return (
    <View className="home">
      <LoadPage></LoadPage>
      <Image className="cover" src={CoverImg}></Image>
      <Text className="version">{VERSION}</Text>
      <View className="user-info">
        <Player data={userInfo} colorType="black"></Player>
        <View className="at-row icon-row">
          <AtIcon
            className="setting"
            value="settings"
            size="30"
            color="#666"
            onClick={() => {
              forceGetUserProfile(() => {
                const userInfo = Taro.getStorageSync("userInfo");
                setUserInfo(userInfo);
              });
            }}
          ></AtIcon>
        </View>
      </View>
      <View className="btn-list">
        <AtButton
          circle
          type="primary"
          onClick={() => {
            getUserProfile(() => {
              navigateTo("Martian", `hall/index`);
            });
          }}
        >
          <Image src={MartianLogoImg}></Image>
          火星骰
        </AtButton>
        <AtButton
          circle
          type="primary"
          onClick={() => {
            getUserProfile(() => {
              navigateTo("Yahtzee", `hall/index`);
            });
          }}
        >
          <Image src={YahtzeeLogoImg}></Image>
          快艇骰子
        </AtButton>
        <AtButton
          circle
          type="primary"
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
