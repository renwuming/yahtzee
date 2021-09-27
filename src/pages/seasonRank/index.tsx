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
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/tabs.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/divider.scss";
import "taro-ui/dist/style/components/fab.scss";
import "./index.scss";
import PlayerItem from "../../Components/SeasonRankPlayer";
import { RANKING_LEN } from "../../const";
import {
  applySeasonRank_Database,
  getSeasonRankList_Database,
} from "./rankApi";
// import { TabItem } from "taro-ui/types/tabs";

export default function Index() {
  // const [tabList, setTabList] = useState<TabItem[]>([]);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [list1, setList1] = useState<SeasonRankPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [seansonRank, setSeansonRank] = useState<SeasonRank>(null);

  const { desTitle, desContent } = seansonRank || {};
  const showContent = desContent?.split("\\n").join("\n");

  async function updateList1() {
    setLoading(true);
    const data = await getSeasonRankList_Database();
    const { name, list } = data;

    setSeansonRank(data);
    setList1(list);
    Taro.setNavigationBarTitle({
      title: `${name}-赛季排行榜`,
    });
    setLoading(false);
  }

  useEffect(() => {
    updateList1().then((_) => {
      setIsOpened(true);
    });
  }, []);

  function reloadPage() {
    setList1([]);
    updateList1();
  }
  function applySeasonRank() {
    Taro.showModal({
      content: "确定您已经在【蓝宝盒】小程序报名参赛？",
      cancelText: "未报名",
      confirmText: "已报名",
      success: async (res) => {
        if (res.confirm) {
          await applySeasonRank_Database();
          reloadPage();
        } else if (res.cancel) {
          Taro.showModal({
            content: "现在去报名参赛？",
            success: async (res) => {
              if (res.confirm) {
                Taro.navigateToMiniProgram({
                  appId: "wx1b154d20a69a455e",
                  path: "pages/lobby/room?id=14139e12615000670f57d2945a4ad31e",
                });
              } else if (res.cancel) {
              }
            },
          });
        }
      },
    });
  }

  function onClose() {
    setIsOpened(false);
  }

  return (
    <View className="season-ranking">
      <AtTabs current={tabIndex} tabList={[]} onClick={setTabIndex}>
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
      </AtTabs>
      <View className="fab-btn">
        <AtFab
          onClick={async () => {
            applySeasonRank();
          }}
        >
          我要上榜
        </AtFab>
      </View>

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
