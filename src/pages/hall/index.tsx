import { ScrollView, View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/tabs.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/divider.scss";
import "./index.scss";
import { getHallGames, getMyGames } from "./hallApi";
import GameItem from "../../Components/GameItem";
import { PAGE_LEN } from "../../const";

export default function Index() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const tabList = [{ title: "大厅" }, { title: "我的房间" }];
  const [hallGameList, setHallGameList] = useState<GameData[]>([]);
  const [hallPageNum, setHallPageNum] = useState<number>(0);
  const [myGameList, setMyGameList] = useState<GameData[]>([]);
  const [myPageNum, setMyPageNum] = useState<number>(0);
  const [hallPageEnd, setHallPageEnd] = useState<boolean>(false);
  const [myPageEnd, setMyPageEnd] = useState<boolean>(false);

  async function updateHallGameList() {
    if (hallPageEnd) return;
    const list = await getHallGames(hallPageNum);
    setHallGameList(hallGameList.concat(list));
    setHallPageNum(hallPageNum + 1);
    if (list.length < PAGE_LEN) {
      setHallPageEnd(true);
    }
  }
  async function updateMyGameList() {
    if (myPageEnd) return;
    const list = await getMyGames(myPageNum);
    setMyGameList(myGameList.concat(list));
    setMyPageNum(myPageNum + 1);
    if (list.length < PAGE_LEN) {
      setMyPageEnd(true);
    }
  }

  useEffect(() => {
    updateHallGameList();
    updateMyGameList();
  }, []);

  return (
    <View className="hall">
      <AtTabs current={tabIndex} tabList={tabList} onClick={setTabIndex}>
        <AtTabsPane current={tabIndex} index={0}>
          <ScrollView
            className="scroll-view"
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              updateHallGameList();
            }}
          >
            {hallGameList.map((game, index) => {
              return <GameItem game={game} index={index}></GameItem>;
            })}
            {hallPageEnd ? (
              <AtDivider
                className="divider"
                content="只显示最近3小时的活跃房间"
                fontColor="#fff"
                lineColor="#fff"
              />
            ) : (
              <AtIcon
                className="loading"
                value="loading-3"
                size="36"
                color="#fff"
              ></AtIcon>
            )}
          </ScrollView>
        </AtTabsPane>
        <AtTabsPane current={tabIndex} index={1}>
          <ScrollView
            className="scroll-view"
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              updateMyGameList();
            }}
          >
            {myGameList.map((game, index) => {
              return <GameItem game={game} index={index}></GameItem>;
            })}
            {myPageEnd ? (
              <AtDivider
                className="divider"
                content="没有更多了"
                fontColor="#fff"
                lineColor="#fff"
              />
            ) : (
              <AtIcon
                className="loading"
                value="loading-3"
                size="36"
                color="#fff"
              ></AtIcon>
            )}
          </ScrollView>
        </AtTabsPane>
      </AtTabs>
    </View>
  );
}
