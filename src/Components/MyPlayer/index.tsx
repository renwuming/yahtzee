import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "./index.scss";
import Player from "../HomePlayer";
import { forceGetUserProfile, getUserProfile, navigateTo } from "../../utils";
import { useState } from "react";
import LoadPage from "../../Components/LoadPage";
// @ts-ignore
import GoldIcon from "../../assets/imgs/gold.png";

interface IProps {}

export default function Index({}: IProps) {
  const [userInfo, setUserInfo] = useState<any>(
    Taro.getStorageSync("userInfo")
  );
  const { wealth } = userInfo || {};

  function gotoWealthPage() {
    navigateTo("wealth", "index");
  }

  useDidShow(() => {
    setUserInfo(Taro.getStorageSync("userInfo"));
  });

  return (
    <View className="my-player">
      <LoadPage setUserInfo={setUserInfo}></LoadPage>
      <Player data={userInfo} colorType="black" />
      <View className="at-row btn-row">
        <AtButton
          type="primary"
          onClick={() => {
            getUserProfile(() => {
              gotoWealthPage();
            });
          }}
        >
          <Image className="icon" src={GoldIcon} mode="aspectFit" />
          <Text className="icon-text">{wealth?.gold || 0}</Text>
          <AtIcon value="add" size="16" color="#fff"></AtIcon>
        </AtButton>
        <AtButton
          type="primary"
          onClick={() => {
            forceGetUserProfile(() => {
              const userInfo = Taro.getStorageSync("userInfo");
              setUserInfo(userInfo);
            });
          }}
        >
          <AtIcon value="settings" size="20" color="#fff"></AtIcon>
        </AtButton>
      </View>
    </View>
  );
}
