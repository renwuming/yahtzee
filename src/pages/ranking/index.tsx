import { View, Text, ScrollView } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtTabs } from "taro-ui";

import "taro-ui/dist/style/components/tabs.scss";
import Player from "../../Components/Player";
import { CallCloudFunction } from "../../utils";
import "./index.scss";

export default function Index() {
  const tabList = [{ title: "积分榜" }, { title: "胜率榜" }];

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [scoreRanking, setScoreRanking] = useState<Player[]>([]);
  const [winRateRanking, setMultiWinRateRanking] = useState<Player[]>([]);

  useEffect(() => {
    // 胜率榜
    CallCloudFunction({
      name: "getRanking_v2",
      data: {
        type: "winRate",
      },
    }).then((list) => {
      setMultiWinRateRanking(list);
    });
    // 积分榜
    CallCloudFunction({
      name: "getRanking_v2",
      data: {
        type: "score",
      },
    }).then((list) => {
      setScoreRanking(list);
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
      <ScrollView scrollY={true}>
        <View className={tabIndex === 0 ? "" : "hide"}>
          {scoreRanking.map((item, index) => {
            const { highScore } = item;
            return (
              <View key="rank" className="rank-row">
                <Text className={"index " + (index < 3 ? "top" : "")}>
                  {index + 1}
                </Text>
                <View className="user-box">
                  <Player data={item}></Player>
                </View>
                <View className="column-right">
                  <Text className="score-title">分数</Text>
                  <Text className="score">{highScore}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View className={tabIndex === 1 ? "" : "hide"}>
          {winRateRanking.map((item, index) => {
            const { multiWinRate } = item;
            return (
              <View key="rank" className="rank-row">
                <Text className={"index " + (index < 3 ? "top" : "")}>
                  {index + 1}
                </Text>
                <View className="user-box">
                  <Player data={item}></Player>
                </View>
                <View className="column-right">
                  <Text className="score-title">胜率</Text>
                  <Text className="score">{multiWinRate}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
