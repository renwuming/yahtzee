import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtTabs, AtTabsPane } from "taro-ui";

import "taro-ui/dist/style/components/tabs.scss";
import Player from "../../Components/Player";
import { CallCloudFunction } from "../../utils";
import "./index.scss";

export default function Index() {
  const tabList = [{ title: "单人" }, { title: "多人" }];

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [rankinglist, setRankinglist] = useState<Player[]>([]);
  const [multiRankinglist, setMultiRankinglist] = useState<Player[]>([]);

  useEffect(() => {
    // 多人游戏排行榜
    CallCloudFunction({
      name: "getRanking",
      data: {
        multi: true,
      },
    }).then((list) => {
      setMultiRankinglist(list);
    });
    // 单人游戏排行榜
    CallCloudFunction({
      name: "getRanking",
      data: {},
    }).then((list) => {
      setRankinglist(list);
    });
  }, []);

  const dataList = [rankinglist, multiRankinglist];

  return (
    <View className="ranking">
      <AtTabs
        current={tabIndex}
        tabList={tabList}
        onClick={(index) => {
          setTabIndex(index);
        }}
      >
        {[0, 1].map((index) => {
          return (
            <AtTabsPane current={tabIndex} index={index}>
              {dataList[index].map((item, index) => {
                const { sumScore } = item;
                return (
                  <View key="rank" className="rank-row">
                    <Text className={"index " + (index < 3 ? "top" : "")}>
                      {index + 1}
                    </Text>
                    <View className="user-box">
                      <Player data={item}></Player>
                    </View>
                    <View className="column-right">
                      <Text className="score-title">得分</Text>
                      <Text className="score">{sumScore}</Text>
                    </View>
                  </View>
                );
              })}
            </AtTabsPane>
          );
        })}
      </AtTabs>
    </View>
  );
}
