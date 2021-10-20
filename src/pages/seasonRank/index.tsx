interface RankItemProps {
  index: number;
  data: SeasonRankPlayer;
}

function RankItem({ data }: RankItemProps) {
  const { rankType, rankLevel, rankImgUrl } = data;
  const showRankLevel = [null, "I", "II", "III", "IV", "V"][rankLevel];
  return (
    <View key="rank" className="rank-item">
      {rankType && (
        <Image className="level-img" src={rankImgUrl} mode="aspectFit"></Image>
      )}
      <View className="user-box">
        <PlayerItem data={data}></PlayerItem>
      </View>
      <View className="column-right">
        <Text className="score-title">{rankType || "无等级"}</Text>
        {rankLevel && <Text className="score">{showRankLevel}</Text>}
      </View>
    </View>
  );
}

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
        <PlayerItem2 data={data}></PlayerItem2>
      </View>
      <View className="column-right">
        <Text className="score-title">🌹</Text>
        <Text className="score">{roseSum}</Text>
      </View>
    </View>
  );
}

import Taro from "@tarojs/taro";
import { ScrollView, View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import {
  AtDivider,
  AtFab,
  AtIcon,
  AtTabs,
  AtTabsPane,
  AtModal,
  AtModalHeader,
  AtModalContent,
} from "taro-ui";
import "./index.scss";
import PlayerItem from "../../Components/SeasonRankPlayer";
import PlayerItem2 from "../../Components/Player";
import { RANKING_LEN, PAGE_LEN } from "../../const";
import {
  applySeasonRank_Database,
  getCharmRankList_Database,
  getSeasonRankList_Database,
} from "./rankApi";
import { TabItem } from "taro-ui/types/tabs";

export default function Index() {
  const [tabList, setTabList] = useState<TabItem[]>([
    {
      title: "赛季排行",
    },
    {
      title: "魅力榜",
    },
  ]);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [list1, setList1] = useState<SeasonRankPlayer[]>([]);
  const [list2, setList2] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [seansonRank, setSeansonRank] = useState<SeasonRank>(null);
  const [pageNum2, setPageNum2] = useState<number>(0);
  const [page2End, setPage2End] = useState<boolean>(false);

  const { desTitle, desContent } = seansonRank || {};
  const showContent = desContent?.split("\\n").join("\n");

  async function updateList1() {
    setLoading(true);
    const data = await getSeasonRankList_Database();
    const { name, list } = data;
    tabList[0].title = `${name}赛季`;
    setTabList(tabList);
    setSeansonRank(data);
    setList1(list);
    setLoading(false);
  }
  async function updateList2() {
    const list = await getCharmRankList_Database(pageNum2 * PAGE_LEN, PAGE_LEN);
    const newList = list2.concat(list);
    setList2(newList);
    setPageNum2(pageNum2 + 1);
    if (newList.length >= RANKING_LEN || list.length < PAGE_LEN) {
      setPage2End(true);
    }
  }

  useEffect(() => {
    updateList1().then((_) => {
      setIsOpened(true);
    });
    updateList2();
  }, []);

  function reloadPage() {
    setList1([]);
    updateList1();
  }
  function applySeasonRank() {
    Taro.showModal({
      content:
        "请先去【蓝宝盒】小程序报名参赛，然后加入“任同学の桌游小程序”交流群进行比赛",
      confirmText: "现在报名",
      cancelText: "我已报名",
      success: async (res) => {
        if (res.confirm) {
          Taro.showModal({
            content: "现在去报名参赛？",
            success: async (res) => {
              if (res.confirm) {
                Taro.navigateToMiniProgram({
                  appId: "wx1b154d20a69a455e",
                  path: "pages/lobby/room?id=14139e12615000670f57d2945a4ad31e",
                });
                await applySeasonRank_Database();
                reloadPage();
              } else if (res.cancel) {
              }
            },
          });
        } else if (res.cancel) {
          await applySeasonRank_Database();
          reloadPage();
        }
      },
    });
  }

  function onClose() {
    setIsOpened(false);
  }

  return (
    <View className="season-ranking">
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <ScrollView
            className="scroll-view"
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              // updateList1();
            }}
          >
            {list1.map((data, index) => {
              return <RankItem data={data} index={index}></RankItem>;
            })}
            {loading ? (
              <AtIcon
                className="loading"
                value="loading-3"
                size="36"
                color="#666"
              ></AtIcon>
            ) : (
              <AtDivider
                className="divider"
                content={`只显示前${RANKING_LEN}名`}
                fontColor="#666"
                lineColor="#666"
              />
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
      {tabIndex === 0 && (
        <View className="fab-btn">
          <AtFab
            onClick={async () => {
              applySeasonRank();
            }}
          >
            我要上榜
          </AtFab>
        </View>
      )}
      <AtModal isOpened={isOpened} onClose={onClose}>
        <AtModalHeader>
          <Text>{desTitle}</Text>
        </AtModalHeader>
        <AtModalContent>
          <Text>{showContent}</Text>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
