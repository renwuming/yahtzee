import { ScrollView, View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtBadge, AtDivider, AtFab, AtIcon, AtTabs, AtTabsPane } from "taro-ui";
import "./index.scss";
import { getHallGames, getMyGames } from "./hallApi";
import GameItem from "../../../Components/GameItemForMorePlayers";
import { PAGE_LEN } from "../../../const";
import { createGame } from "../game/gameApi";
import { gotoCantStopGuide, navigateTo } from "../../../utils";

export default function Index() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const tabList = [{ title: "大厅" }, { title: "我的房间" }];
  const [hallGameList, setHallGameList] = useState<Martian.GameData[]>([]);
  const [hallPageNum, setHallPageNum] = useState<number>(0);
  const [myGameList, setMyGameList] = useState<Martian.GameData[]>([]);
  const [myPageNum, setMyPageNum] = useState<number>(0);
  const [hallPageEnd, setHallPageEnd] = useState<boolean>(false);
  const [myPageEnd, setMyPageEnd] = useState<boolean>(false);

  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    if (refresh) {
      updateHallGameList();
      updateMyGameList();
    }
    refresh && setTimeout(() => setRefresh(false));
  }, [refresh]);

  // 首次加载
  useEffect(() => {
    updateHallGameList();
    updateMyGameList();
  }, []);

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

  function reloadPage() {
    setHallGameList([]);
    setMyGameList([]);
    setHallPageNum(0);
    setMyPageNum(0);
    setHallPageEnd(false);
    setMyPageEnd(false);
    // 刷新页面，重新加载
    setRefresh(true);
  }

  return (
    <View className="cantstop-hall">
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
              return (
                <GameItem
                  game={game}
                  index={index}
                  gameType="CantStop"
                ></GameItem>
              );
            })}
            {hallPageEnd ? (
              <AtDivider
                className="divider"
                content="只显示最近3小时的活跃房间"
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
            scrollY={true}
            enableBackToTop={true}
            onScrollToLower={() => {
              updateMyGameList();
            }}
          >
            {myGameList.map((game, index) => {
              return (
                <GameItem
                  game={game}
                  index={index}
                  gameType="CantStop"
                ></GameItem>
              );
            })}
            {myPageEnd ? (
              <AtDivider
                className="divider"
                content="没有更多了"
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

      {/* 悬浮按钮 */}
      <View className="fab-btn create-room">
        <AtFab
          onClick={() => {
            createGame();
          }}
        >
          <AtBadge className="shake" value={"点我开始"}>
            <Text className="at-fab__icon at-icon at-icon-add"></Text>
          </AtBadge>
        </AtFab>
      </View>
      <View className="fab-btn reload">
        <AtFab
          onClick={() => {
            reloadPage();
          }}
        >
          <Text className="at-fab__icon at-icon at-icon-reload"></Text>
        </AtFab>
      </View>
      <View className="fab-btn guide">
        <AtFab
          onClick={() => {
            gotoCantStopGuide();
          }}
        >
          <AtBadge className="shake" value={"不会玩点我"}>
            <Text className="at-fab__icon at-icon at-icon-help"></Text>
          </AtBadge>
        </AtFab>
      </View>
      <View className="fab-btn ranking">
        <AtFab
          onClick={() => {
            navigateTo("CantStop", `ranking/index`);
          }}
        >
          <Text className="at-fab__icon at-icon at-icon-numbered-list"></Text>
        </AtFab>
      </View>
      <View className="fab-btn history">
        <AtFab
          onClick={() => {
            navigateTo("CantStop", `history/index`);
          }}
        >
          <Text className="at-fab__icon at-icon at-icon-clock"></Text>
        </AtFab>
      </View>
    </View>
  );
}
