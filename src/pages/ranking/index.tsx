import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { AtTabs, AtIcon } from "taro-ui";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/tabs.scss";
import PlayerItem from "../../Components/Player";
import { CallCloudFunction } from "../../utils";
import "./index.scss";

export default function Index() {
  const tabList = [{ title: "积分榜" }, { title: "赌神榜" }];

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [scoreRanking, setScoreRanking] = useState<Player[]>([]);
  const [winRateRanking, setMultiWinRateRanking] = useState<Player[]>([]);

  useEffect(() => {
    // 积分榜
    CallCloudFunction({
      name: "getRanking_v2",
      data: {
        type: "score",
      },
    }).then((list) => {
      setScoreRanking(list);
    });
    // 赌神榜
    CallCloudFunction({
      name: "getRanking_v2",
      data: {
        type: "sum",
      },
    }).then((list) => {
      setMultiWinRateRanking(list);
    });
  }, []);

  return (
    <View className="ranking">
      <AtTabs
        current={tabIndex}
        tabList={tabList}
        onClick={(index) => {
          setTabIndex(index);
        }}
      ></AtTabs>
      <ScrollView className="scroll-box" scrollY={true}>
        <View className={tabIndex === 0 ? "" : "hide"}>
          {scoreRanking.length > 0 ? (
            scoreRanking.map((item, index) => {
              const { highScore } = item;
              return (
                <View key="rank" className="rank-row">
                  <Text className={"index " + (index < 3 ? "top" : "")}>
                    {index + 1}
                  </Text>
                  <View className="user-box">
                    <PlayerItem data={item}></PlayerItem>
                  </View>
                  <View className="column-right">
                    <Text className="score-title">分数</Text>
                    <Text className="score">{highScore}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <AtIcon
              className="loading"
              value="loading-3"
              size="60"
              color="#fff"
            ></AtIcon>
          )}
        </View>
        <View className={tabIndex === 1 ? "" : "hide"}>
          {winRateRanking.length > 0 ? (
            winRateRanking.map((item, index) => {
              const { multiWinSum } = item;
              return (
                <View key="rank" className="rank-row">
                  <Text className={"index " + (index < 3 ? "top" : "")}>
                    {index + 1}
                  </Text>
                  <View className="user-box">
                    <PlayerItem data={item}></PlayerItem>
                  </View>
                  <View className="column-right">
                    <Text className="score-title">获胜局数</Text>
                    <Text className="score">{multiWinSum}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <AtIcon
              className="loading"
              value="loading-3"
              size="60"
              color="#fff"
            ></AtIcon>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
