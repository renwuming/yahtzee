import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text, CommonEventFunction, Image } from "@tarojs/components";
import {
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtTabs,
  AtTabsPane,
  AtButton,
  AtIcon,
} from "taro-ui";
import { useContext, useEffect, useMemo, useState } from "react";
import { CallCloudFunction, isMe, navigateTo } from "../../utils";
import "./index.scss";
import { AchievementGameIndex, PlayerContext } from "../../const";
// @ts-ignore
import GoldIcon from "../../assets/imgs/gold.png";
import { Bomb, Rose, Praise } from "../Gifts";
import { updateGiftDeal_Database } from "./giftApi";

interface IProps {
  data: Player;
  index?: number;
  isOpened: boolean;
  onClose: CommonEventFunction<any>;
}

export default function Index({ data, index = -1, isOpened, onClose }: IProps) {
  const playerContext = useContext(PlayerContext);
  const { showGift, initGameIndex, playerIndex, players, gameID } =
    playerContext;

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
    if (initGameIndex < 0 || initGameIndex === AchievementGameIndex.set) {
      list.push({ title: "形色牌" });
    }
    if (realShowGift) {
      list.push({
        title: "礼物",
      });
    }
    return list;
  }, [initGameIndex, realShowGift]);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [playerData, setPlayerData] = useState<any>(null);
  const [waiting, setWaiting] = useState<boolean>(false);
  async function initAchievement() {
    const playerData = await CallCloudFunction({
      name: "getPlayers",
      data: { openid },
    });
    setPlayerData(playerData);
  }

  useEffect(() => {
    if (isOpened) initAchievement();
  }, [isOpened]);
  useDidShow(() => {
    initAchievement();
  });

  const { achievement, wealth } = playerData || {};
  const { yahtzee, martian, cantstop, set } = achievement || {};
  const { gold } = wealth || {};

  function handleAchievementValue(value) {
    return value === undefined || value === null ? "-" : value;
  }

  function getTabIndex(title) {
    const item = tabList.find((item) => item.title === title);
    return tabList.indexOf(item);
  }

  const giftList: GiftItem[] = [
    {
      type: "rose",
      icon: Rose,
      price: 10,
    },
    {
      type: "bomb",
      icon: Bomb,
      price: 10,
    },
    {
      type: "praise",
      icon: Praise,
      price: 10,
    },
  ];

  async function sendGiftTo(gift: GiftItem) {
    if (waiting) return;
    const { type, price } = gift;
    const sender = players[playerIndex].openid;
    const receiver = players[index].openid;
    try {
      setWaiting(true);
      await updateGiftDeal_Database(sender, receiver, type, price, gameID);
    } catch (err) {
      Taro.showToast({
        title: err,
        icon: "none",
        duration: 1500,
      });
    }
    setWaiting(false);
  }

  function gotoWealthPage() {
    navigateTo("wealth", "index");
  }

  return (
    <View className="achievement-box">
      <AtModal isOpened={isOpened} onClose={onClose}>
        <AtModalHeader>
          <View className="player-info-big">
            <Image className={`avatar`} src={avatarUrl}></Image>
            <Text>{nickName}</Text>
          </View>
          {me && (
            <View className="at-row btn-row">
              <AtButton
                type="primary"
                onClick={() => {
                  gotoWealthPage();
                }}
              >
                <Image className="icon" src={GoldIcon} mode="aspectFit" />
                <Text className="icon-text">{gold || 0}</Text>
                <AtIcon value="add" size="16" color="#fff"></AtIcon>
              </AtButton>
            </View>
          )}
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
            {(initGameIndex < 0 ||
              initGameIndex === AchievementGameIndex.set) && (
              <AtTabsPane current={tabIndex} index={getTabIndex("形色牌")}>
                <View className="detail-row">
                  <Text className="left red">最高分</Text>
                  <Text className="red">
                    {handleAchievementValue(set?.highScore)}
                  </Text>
                </View>
                <View className="detail-row">
                  <Text className="left">多人局胜率</Text>
                  <Text className="info">
                    {handleAchievementValue(set?.multiWinRate)}
                  </Text>
                </View>
                <View className="detail-row">
                  <Text className="left">多人局胜利</Text>
                  <Text className="info">
                    {handleAchievementValue(set?.multiWinSum)}
                  </Text>
                </View>
                <View className="detail-row">
                  <Text className="left">多人局总数</Text>
                  <Text className="info">
                    {handleAchievementValue(set?.multiNum)}
                  </Text>
                </View>
                <View className="detail-row">
                  <Text className="left">单人局总数</Text>
                  <Text className="info">
                    {handleAchievementValue(set?.singleNum)}
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
                  {giftList.map((item) => {
                    const { icon, price } = item;
                    return (
                      <View className="item-box at-col at-col-3">
                        <View
                          className="item"
                          onClick={() => {
                            sendGiftTo(item);
                          }}
                        >
                          <View className="top">{icon()}</View>
                          <View className="bottom">
                            <Image
                              className="img"
                              src={GoldIcon}
                              mode="aspectFit"
                            />
                            {price}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AtTabsPane>
            )}
          </AtTabs>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
