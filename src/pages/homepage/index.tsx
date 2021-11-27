import { View, Image, Text } from "@tarojs/components";
import {
  getCurrentInstance,
  useDidShow,
  useShareAppMessage,
} from "@tarojs/taro";
import { useState } from "react";
import { AtButton, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import "./index.scss";
// @ts-ignore
import GoldIcon from "../../assets/imgs/gold.png";
import { getPlayerByOpenid, isMe, navigateTo } from "@/utils";
import AchievementItem from "@/Components/AchievementItem";
import GiftAchievementItem from "@/Components/GiftAchievementItem";

export default function Index() {
  const openid = getCurrentInstance()?.router?.params?.openid;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = userInfo;
    const title = `${nickName}的个人主页`;
    return {
      title,
      path: `/pages/homepage/index?openid=${openid}`,
    };
  });

  const [tabIndex, setTabIndex] = useState<number>(0);
  const tabList = [
    {
      title: "成就",
    },
    {
      title: "礼物",
    },
    // {
    //   title: "物品",
    // },
  ];
  const [userInfo, setUserInfo] = useState<Player>(null);

  const { wealth, gift, avatarUrl, nickName, achievement } = userInfo || {};
  const { yahtzee, martian, cantstop, set } = achievement || {};

  const me = isMe(openid);

  useDidShow(() => {
    initUserInfo();
  });

  function initUserInfo() {
    getPlayerByOpenid(openid).then((player) => {
      setUserInfo(player);
    });
  }

  return (
    <View className="homepage">
      <View className="homepage-player-info">
        <View className="top">
          <Image className={`avatar`} src={avatarUrl}></Image>
          <Text className="nick">{nickName}</Text>
        </View>
        <View className="at-row btn-row">
          <AtButton
            className={`${me ? "" : "p-right"}`}
            type="primary"
            onClick={() => {
              me && navigateTo("wealth", "index");
            }}
          >
            <Image className="icon" src={GoldIcon} mode="aspectFit" />
            <Text className="icon-text">{wealth?.gold || 0}</Text>
            {me && <AtIcon value="add" size="16" color="#fff"></AtIcon>}
          </AtButton>
        </View>
      </View>
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <AchievementItem gameName="yahtzee" data={yahtzee}></AchievementItem>
          <AchievementItem gameName="martian" data={martian}></AchievementItem>
          <AchievementItem
            gameName="cantstop"
            data={cantstop}
          ></AchievementItem>
          <AchievementItem gameName="set" data={set}></AchievementItem>
        </AtTabsPane>
        <AtTabsPane current={tabIndex} index={1}>
          <GiftAchievementItem
            giftName="rose"
            data={gift}
          ></GiftAchievementItem>
          <GiftAchievementItem
            giftName="bomb"
            data={gift}
          ></GiftAchievementItem>
          <GiftAchievementItem
            giftName="praise"
            data={gift}
          ></GiftAchievementItem>
        </AtTabsPane>
      </AtTabs>
    </View>
  );
}
