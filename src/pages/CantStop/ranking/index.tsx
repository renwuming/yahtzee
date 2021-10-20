interface RankItemProps {
  index: number;
  data: CantStop.CantStopPlayer;
  type: "round" | "sum";
}

function RankItem({ index, data, type }: RankItemProps) {
  const { achievement } = data;
  return (
    <View key="rank" className="rank-item">
      <Text className={"index " + (index < 3 ? "top" : "")}>{index + 1}</Text>
      <View className="user-box">
        <PlayerItem data={data}></PlayerItem>
      </View>
      {type === "round" ? (
        <View className="column-right">
          <Text className="score-title">最少回合数</Text>
          <Text className="score">{achievement?.cantstop?.minRoundSum}</Text>
        </View>
      ) : (
        <View className="column-right">
          <Text className="score-title">获胜局数</Text>
          <Text className="score">{achievement?.cantstop?.multiWinSum}</Text>
        </View>
      )}
    </View>
  );
}

import { ScrollView, View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import "./index.scss";
import PlayerItem from "../../../Components/CantStopPlayer";
import { PAGE_LEN, RANKING_LEN } from "../../../const";
import { CallCloudFunction } from "../../../utils";

export default function Index() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const tabList = [{ title: "赌神榜" }, { title: "幸运榜" }];
  const [list1, setList1] = useState<CantStop.CantStopPlayer[]>([]);
  const [pageNum1, setPageNum1] = useState<number>(0);
  const [list2, setList2] = useState<CantStop.CantStopPlayer[]>([]);
  const [pageNum2, setPageNum2] = useState<number>(0);
  const [page1End, setPage1End] = useState<boolean>(false);
  const [page2End, setPage2End] = useState<boolean>(false);

  async function updateList1() {
    if (page1End) return;
    const list = await CallCloudFunction({
      name: "cantstopGetRanking",
      data: {
        type: "sum",
        skip: pageNum1 * PAGE_LEN,
        pageLength: PAGE_LEN,
      },
    });
    const newList = list1.concat(list);
    setList1(newList);
    setPageNum1(pageNum1 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage1End(true);
    }
  }
  async function updateList2() {
    if (page2End) return;
    const list = await CallCloudFunction({
      name: "cantstopGetRanking",
      data: {
        type: "round",
        skip: pageNum2 * PAGE_LEN,
        pageLength: PAGE_LEN,
      },
    });
    const newList = list2.concat(list);
    setList2(newList);
    setPageNum2(pageNum2 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage2End(true);
    }
  }

  useEffect(() => {
    updateList1();
    updateList2();
  }, []);

  return (
    <View className="cantstop-ranking">
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <ScrollView
            className="scroll-view"
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              updateList1();
            }}
          >
            {list1.map((data, index) => {
              return (
                <RankItem data={data} index={index} type={"sum"}></RankItem>
              );
            })}
            {page1End ? (
              <AtDivider
                className="divider"
                content={`只显示前${RANKING_LEN}名`}
                fontColor="#666"
                lineColor="#666"
              />
            ) : (
              <AtIcon
                className="loading"
                value="loading-3"
                size="36"
                color="#666"
              ></AtIcon>
            )}
          </ScrollView>
        </AtTabsPane>
        <AtTabsPane current={tabIndex} index={1}>
          <ScrollView
            className="scroll-view scroll-view2"
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              updateList2();
            }}
          >
            {list2.map((data, index) => {
              return (
                <RankItem data={data} index={index} type={"round"}></RankItem>
              );
            })}
            {page2End ? (
              <AtDivider
                className="divider"
                content={`只显示前${RANKING_LEN}名`}
                fontColor="#666"
                lineColor="#666"
              />
            ) : (
              <AtIcon
                className="loading"
                value="loading-3"
                size="36"
                color="#666"
              ></AtIcon>
            )}
          </ScrollView>
        </AtTabsPane>
      </AtTabs>
    </View>
  );
}
