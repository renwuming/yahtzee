import { ScrollView, View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import PlayerItem from "@/Components/HallPlayer";
import { PAGE_LEN, RANKING_LEN } from "@/const";
import { CallCloudFunction, getSeasonRankData } from "@/utils";
import "./index.scss";

interface RankItemProps {
  index: number;
  data: Player | SeasonRankPlayerData;
  type: "sum" | "round" | "rank";
}

function RankItem({ index, data, type }: RankItemProps) {
  const { achievement, score, rankImgUrl } = data as SeasonRankPlayerData;
  return (
    <View key="rank" className="rank-item">
      {type === "rank" ? (
        <Image className="level-img" src={rankImgUrl} mode="aspectFit"></Image>
      ) : (
        <Text className={"index " + (index < 3 ? "top" : "")}>{index + 1}</Text>
      )}
      <View className="user-box">
        <PlayerItem data={data}></PlayerItem>
      </View>
      {type === "sum" && (
        <View className="column-right">
          <Text className="score-title">获胜局数</Text>
          <Text className="score">{achievement?.rummy?.multiWinSum}</Text>
        </View>
      )}
      {type === "round" && (
        <View className="column-right">
          <Text className="score-title">最少用牌</Text>
          <Text className="score">{achievement?.rummy?.minGroundCardSum}</Text>
        </View>
      )}
      {type === "rank" && (
        <View className="column-right">
          <Text className="score-title">赛季积分</Text>
          <Text className="score">{score}</Text>
        </View>
      )}
    </View>
  );
}

export default function Index() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const tabList = [
    { title: "赛季榜" },
    { title: "赌神榜" },
    { title: "幸运榜" },
  ];
  const [list1, setList1] = useState<Player[]>([]);
  const [pageNum1, setPageNum1] = useState<number>(0);
  const [list2, setList2] = useState<Player[]>([]);
  const [pageNum2, setPageNum2] = useState<number>(0);
  const [list3, setList3] = useState<SeasonRankPlayerData[]>([]);
  const [pageNum3, setPageNum3] = useState<number>(0);
  const [page1End, setPage1End] = useState<boolean>(false);
  const [page2End, setPage2End] = useState<boolean>(false);
  const [page3End, setPage3End] = useState<boolean>(false);

  async function updateList1() {
    if (page1End) return;
    const list = await CallCloudFunction({
      name: "gameApi",
      data: {
        action: "getRanking",
        gameDbName: "rummy_games",
        data: {
          type: "sum",
          skip: pageNum1 * PAGE_LEN,
          pageLength: PAGE_LEN,
        },
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
      name: "gameApi",
      data: {
        action: "getRanking",
        gameDbName: "rummy_games",
        data: {
          type: "cardSum",
          skip: pageNum2 * PAGE_LEN,
          pageLength: PAGE_LEN,
        },
      },
    });
    const newList = list2.concat(list);
    setList2(newList);
    setPageNum2(pageNum2 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage2End(true);
    }
  }
  async function updateList3() {
    if (page3End) return;
    const list = await getSeasonRankData("rummy", pageNum3);
    const newList = list3.concat(list);
    setList3(newList);
    setPageNum3(pageNum3 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage3End(true);
    }
  }

  useEffect(() => {
    updateList1();
    updateList2();
    updateList3();
  }, []);

  return (
    <View className="rummy-ranking">
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <ScrollView
            className="scroll-view"
            scrollY
            enableBackToTop
            onScrollToLower={() => {
              updateList3();
            }}
          >
            {list3.map((data, index) => {
              return (
                <RankItem
                  key={data.openid}
                  data={data}
                  index={index}
                  type="rank"
                ></RankItem>
              );
            })}
            {page3End ? (
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
            className="scroll-view"
            scrollY
            enableBackToTop
            onScrollToLower={() => {
              updateList1();
            }}
          >
            {list1.map((data, index) => {
              return (
                <RankItem
                  key={data.openid}
                  data={data}
                  index={index}
                  type="sum"
                ></RankItem>
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
        <AtTabsPane current={tabIndex} index={2}>
          <ScrollView
            className="scroll-view scroll-view2"
            scrollY
            enableBackToTop
            onScrollToLower={() => {
              updateList2();
            }}
          >
            {list2.map((data, index) => {
              return (
                <RankItem
                  key={data.openid}
                  data={data}
                  index={index}
                  type="round"
                ></RankItem>
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
