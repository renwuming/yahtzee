import { View, Text, CommonEventFunction, Image } from "@tarojs/components";
import {
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtTabs,
  AtTabsPane,
} from "taro-ui";
import "taro-ui/dist/style/components/tabs.scss";
import { useEffect, useState } from "react";
import { CallCloudFunction } from "../../utils";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";
import { AchievementGameIndex } from "../../const";

interface IProps {
  data: Player;
  isOpened: boolean;
  onClose: CommonEventFunction<any>;
  initGameIndex?: number;
}

export default function Index({
  data,
  isOpened,
  onClose,
  initGameIndex = AchievementGameIndex.yahtzee,
}: IProps) {
  const tabList = [
    { title: "快艇骰子" },
    { title: "火星骰" },
    { title: "欲罢不能" },
  ];
  const [tabIndex, setTabIndex] = useState<number>(initGameIndex);
  const [achievementData, setAchievementData] = useState<any>(null);

  const { openid, nickName, avatarUrl } = data;

  async function initAchievement() {
    const { achievement } = await CallCloudFunction({
      name: "getPlayers",
      data: { openid },
    });
    setAchievementData(achievement);
  }

  useEffect(() => {
    if (isOpened) initAchievement();
  }, [isOpened]);

  const { yahtzee, martian, cantstop } = achievementData || {};

  function handleAchievementValue(value) {
    return value === undefined || value === null ? "-" : value;
  }

  return (
    <View className="achievement-box">
      <AtModal isOpened={isOpened} onClose={onClose}>
        <AtModalHeader>
          <View className="player-info-big">
            <Image className={`avatar`} src={avatarUrl}></Image>
            <Text>{nickName}</Text>
          </View>
        </AtModalHeader>
        <AtModalContent>
          <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
            <AtTabsPane current={tabIndex} index={0}>
              <View className="detail-row">
                <Text className="left red">最高分</Text>
                <Text className="red">
                  {handleAchievementValue(yahtzee?.highScore)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜率</Text>
                <Text className="info">
                  {handleAchievementValue(yahtzee?.multiWinRate)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜利</Text>
                <Text className="info">
                  {handleAchievementValue(yahtzee?.multiWinSum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(yahtzee?.multiNum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">单人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(yahtzee?.singleNum)}
                </Text>
              </View>
            </AtTabsPane>
            <AtTabsPane current={tabIndex} index={1}>
              <View className="detail-row">
                <Text className="left red">最高分</Text>
                <Text className="red">
                  {handleAchievementValue(martian?.highScore)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left red">单人局最少回合</Text>
                <Text className="red">
                  {handleAchievementValue(martian?.minRoundSum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜率</Text>
                <Text className="info">
                  {handleAchievementValue(martian?.multiWinRate)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜利</Text>
                <Text className="info">
                  {handleAchievementValue(martian?.multiWinSum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(martian?.multiNum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">单人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(martian?.singleNum)}
                </Text>
              </View>
            </AtTabsPane>
            <AtTabsPane current={tabIndex} index={2}>
              <View className="detail-row">
                <Text className="left red">单人局最少回合</Text>
                <Text className="red">
                  {handleAchievementValue(cantstop?.minRoundSum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜率</Text>
                <Text className="info">
                  {handleAchievementValue(cantstop?.multiWinRate)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局胜利</Text>
                <Text className="info">
                  {handleAchievementValue(cantstop?.multiWinSum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">多人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(cantstop?.multiNum)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="left">单人局总数</Text>
                <Text className="info">
                  {handleAchievementValue(cantstop?.singleNum)}
                </Text>
              </View>
            </AtTabsPane>
          </AtTabs>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
