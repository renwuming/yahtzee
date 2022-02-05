import { ScrollView, View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import { TabItem } from "taro-ui/types/tabs";
import PlayerItem from "@/Components/HallPlayer";
import { RANKING_LEN, PAGE_LEN } from "@/const";
import { Rose } from "@/Components/Gifts";
import SeasonRankList from "@/Components/SeasonRankList";
import { getCharmRankList_Database } from "./rankApi";
import "./index.scss";

interface CharmItemProps {
  index: number;
  data: Player;
}

function CharmItem({ index, data }: CharmItemProps) {
  const { gift } = data;
  const roseSum = gift?.receive?.rose || 0;
  return (
    <View key="rank" className="rank-item-2">
      <Text className={"index " + (index < 3 ? "top" : "")}>{index + 1}</Text>
      <View className="user-box">
        <PlayerItem data={data}></PlayerItem>
      </View>
      <View className="column-right">
        <View className="icon">{Rose()}</View>
        <Text className="score">{roseSum}</Text>
      </View>
    </View>
  );
}

export default function Index() {
  const [tabList, setTabList] = useState<TabItem[]>([
    {
      title: "赛季榜",
    },
    {
      title: "魅力榜",
    },
  ]);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [list2, setList2] = useState<Player[]>([]);
  const [pageNum2, setPageNum2] = useState<number>(0);
  const [page2End, setPage2End] = useState<boolean>(false);

  async function updateList2() {
    if (page2End) return;
    const list = await getCharmRankList_Database(pageNum2 * PAGE_LEN, PAGE_LEN);
    const newList = list2.concat(list);
    setList2(newList);
    setPageNum2(pageNum2 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage2End(true);
    }
  }

  useEffect(() => {
    updateList2();
  }, []);

  return (
    <View className="season-ranking">
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <SeasonRankList game="rummy"></SeasonRankList>
        </AtTabsPane>
        <AtTabsPane current={tabIndex} index={1}>
          <ScrollView
            className="scroll-view scroll-view2"
            scrollY
            enableBackToTop
            onScrollToLower={() => {
              updateList2();
            }}
          >
            {list2.map((data, index) => {
              return <CharmItem data={data} index={index}></CharmItem>;
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
