import { View, Text, CommonEventFunction, Image } from "@tarojs/components";
import {
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtTabs,
  AtTabsPane,
  AtButton,
} from "taro-ui";
import "taro-ui/dist/style/components/tabs.scss";
import "taro-ui/dist/style/components/flex.scss";
import { useEffect, useMemo, useState } from "react";
import { CallCloudFunction, isMe } from "../../utils";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";
import { AchievementGameIndex } from "../../const";
// @ts-ignore
import roseImg from "../../assets/imgs/rose.png";
// @ts-ignore
import goldImg from "../../assets/imgs/gold.png";
import { animate } from "./animate";

interface IProps {
  data: Player;
  isOpened: boolean;
  onClose: CommonEventFunction<any>;
  initGameIndex?: number;
  showGift?: boolean;
}

export default function Index({
  data,
  isOpened,
  onClose,
  initGameIndex = -1,
  showGift = false,
}: IProps) {
  const { openid, nickName, avatarUrl } = data;
  const me = isMe(openid);
  const realShowGift = showGift && !me;

  const tabList = useMemo(() => {
    const list = [];
    if (initGameIndex < 0 || initGameIndex === AchievementGameIndex.yahtzee) {
      list.push({
        title: "快艇骰子",
      });
    }
    if (initGameIndex < 0 || initGameIndex === AchievementGameIndex.martian) {
      list.push({ title: "火星骰" });
    }
    if (initGameIndex < 0 || initGameIndex === AchievementGameIndex.cantstop) {
      list.push({ title: "欲罢不能" });
    }
    if (realShowGift) {
      list.push({
        title: "礼物",
      });
    }
    return list;
  }, [initGameIndex, realShowGift]);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [achievementData, setAchievementData] = useState<any>(null);
  const [v, setV] = useState<boolean>(false);

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

  function getTabIndex(title) {
    const item = tabList.find((item) => item.title === title);
    return tabList.indexOf(item);
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
            {(initGameIndex < 0 ||
              initGameIndex === AchievementGameIndex.yahtzee) && (
              <AtTabsPane current={tabIndex} index={getTabIndex("快艇骰子")}>
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
            )}
            {(initGameIndex < 0 ||
              initGameIndex === AchievementGameIndex.martian) && (
              <AtTabsPane current={tabIndex} index={getTabIndex("火星骰")}>
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
            )}
            {(initGameIndex < 0 ||
              initGameIndex === AchievementGameIndex.cantstop) && (
              <AtTabsPane current={tabIndex} index={getTabIndex("欲罢不能")}>
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
            )}
            {realShowGift && (
              <AtTabsPane
                className="gift-tab"
                current={tabIndex}
                index={getTabIndex("礼物")}
              >
                <View className="gift-box at-row at-row__align--center">
                  <View className="item-box at-col at-col-3">
                    <View
                      className="item"
                      onClick={() => {
                        setV(true);
                        // animate();
                        setTimeout(() => {
                          setV(false);
                        }, 1500);
                      }}
                    >
                      <View className="top">
                        <Image className="img" src={roseImg} mode="aspectFit" />
                      </View>
                      <View className="bottom">
                        <AtButton
                        // disabled={remainingTimes <= 0}
                        >
                          <Image
                            className="img"
                            src={goldImg}
                            mode="aspectFit"
                          />
                          10
                        </AtButton>
                      </View>
                    </View>
                  </View>
                </View>
              </AtTabsPane>
            )}
          </AtTabs>
        </AtModalContent>
      </AtModal>

      <Image
        className={`rose rose-1 ${v ? "gift-1-to-2" : ""}`}
        src={roseImg}
        mode="aspectFit"
      />
      <Image
        className={`rose rose-2 ${v ? "gift-2-to-1" : ""}`}
        src={roseImg}
        mode="aspectFit"
      />
    </View>
  );
}
