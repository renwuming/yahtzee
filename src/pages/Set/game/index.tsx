import PlayerList from "@/Components/MartianPlayerList";
import { AchievementGameIndex, PlayerContext } from "@/const";
import { View, Image, Text } from "@tarojs/components";
import Taro, { useShareAppMessage } from "@tarojs/taro";
import { useMemo, useState } from "react";
import { AtButton } from "taro-ui";
import { initCardList, judgeSet, judgeSetExists } from "./gameApi";
import "./index.scss";

export default function Index() {
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    const title = `${nickName}邀请你来玩神奇形色牌！`;
    return {
      title,
      path: `/pages/Set/game/index`,
      imageUrl: "https://cdn.renwuming.cn/static/diceGames/imgs/set-cover.png",
    };
  });

  const INIT_CARD_SUM = 12;

  const player = Taro.getStorageSync("userInfo");
  player.inRound = true;
  player.sumScore = 0;

  const [players, setPlayers] = useState<Player[]>([player]);
  const initList = useMemo(() => initCardList(), []);
  const [end, setEnd] = useState<boolean>(false);
  const [gameCardList, setGameCardList] = useState<Set.SetCardData[]>(
    initList.slice(0, INIT_CARD_SUM)
  );
  const [reserveCardList, setReserveCardList] = useState<Set.SetCardData[]>(
    initList.slice(INIT_CARD_SUM)
  );
  const [selectedCardList, setSelectedCardList] = useState<Set.SetCardData[]>(
    []
  );

  function selectCard(item: Set.SetCardData) {
    const index = selectedCardList.indexOf(item);
    if (index >= 0) {
      selectedCardList.splice(index, 1);
    } else {
      if (selectedCardList.length >= 3) {
        Taro.showToast({
          title: "最多选择3个",
          icon: "none",
          duration: 1500,
        });
        return;
      }
      selectedCardList.push(item);
    }
    setSelectedCardList([...selectedCardList]);
  }

  function submitSet() {
    const isSet = judgeSet(selectedCardList);
    if (isSet) {
      Taro.showToast({
        title: "成功 +2",
        icon: "none",
        duration: 1500,
      });
      const newCardList = gameCardList.filter(
        (item) => !selectedCardList.includes(item)
      );

      const maxLoopSum = Math.ceil(reserveCardList.length / 3);
      let loopSum = 0;
      let newReserveCardList = [];
      let addList = [];
      let continueFlag = true;
      while (continueFlag) {
        addList = reserveCardList.splice(0, 3);
        const list = newCardList.concat(addList);
        if (judgeSetExists(list) || loopSum >= maxLoopSum) {
          newReserveCardList = reserveCardList;
          continueFlag = false;
          // 游戏结束
          if (loopSum >= maxLoopSum) {
            setEnd(true);
          }
        } else {
          newReserveCardList = reserveCardList.concat(addList);
        }
        loopSum++;
      }

      // 在原位置更新 Card
      let i = 0;
      gameCardList.forEach((item, index) => {
        if (i >= 3) return;
        if (selectedCardList.includes(item)) {
          gameCardList[index] = addList[i] || {};
          i++;
        }
      });

      setGameCardList([...gameCardList]);
      setReserveCardList(newReserveCardList);
      setSelectedCardList([]);
      players[0].sumScore += 2;
      setPlayers([...players]);
    } else {
      Taro.showToast({
        title: "失败 -1",
        icon: "none",
        duration: 1500,
      });
      players[0].sumScore -= 1;
      setPlayers([...players]);
    }
  }

  function showTips() {
    const list = judgeSetExists(gameCardList);
    if (list) {
      setSelectedCardList(list as Set.SetCardData[]);
    } else {
      Taro.showToast({
        title: "不存在 SET",
        icon: "none",
        duration: 1500,
      });
    }
  }

  return (
    <View className="set-game">
      <PlayerContext.Provider
        value={{
          // gameID: id,
          players,
          playerIndex: 0,
          // kickPlayer,
          initGameIndex: AchievementGameIndex.martian,
          showScore: true,
          // showSetting: own && !start,
          showActive: true,
          // showOffline: !end,
          // showGift: !end && inGame,
        }}
      >
        <PlayerList players={players}></PlayerList>
      </PlayerContext.Provider>
      <View className="card-box at-row at-row__align--center">
        {gameCardList.map((item) => {
          const { color, shape, fill, n } = item;
          const selected = selectedCardList.includes(item);
          const nlist = new Array(n).fill(0);
          return (
            <View className={`card-item ${selected ? "selected" : ""}`}>
              <AtButton
                onClick={() => {
                  selectCard(item);
                }}
                disabled={end}
              >
                <View className={`img-row row-${n}`}>
                  {nlist.map((_) => (
                    <Image
                      className="card-img"
                      mode="aspectFit"
                      src={`https://cdn.renwuming.cn/static/set/imgs/${color}-${shape}-${fill}.jpg`}
                    ></Image>
                  ))}
                </View>
              </AtButton>
            </View>
          );
        })}
      </View>

      {end ? (
        <View className="result-box">
          <Text className="text">游戏结束</Text>
        </View>
      ) : (
        <View className="ctrl-box">
          <View className="card-box at-row at-row__align--center">
            {selectedCardList.map((item) => {
              const { color, shape, fill, n } = item;
              const nlist = new Array(n).fill(0);
              return (
                <View className={`card-item`}>
                  <AtButton
                    onClick={() => {
                      selectCard(item);
                    }}
                    disabled={end}
                  >
                    <View className={`img-row row-${n}`}>
                      {nlist.map((_) => (
                        <Image
                          className="card-img"
                          mode="aspectFit"
                          src={`https://cdn.renwuming.cn/static/set/imgs/${color}-${shape}-${fill}.jpg`}
                        ></Image>
                      ))}
                    </View>
                  </AtButton>
                </View>
              );
            })}
          </View>
          <AtButton
            type="primary"
            onClick={() => {
              submitSet();
            }}
            disabled={selectedCardList.length !== 3}
          >
            提交 SET ！
          </AtButton>
          <AtButton
            type="secondary"
            onClick={() => {
              showTips();
            }}
          >
            提示
          </AtButton>
        </View>
      )}
    </View>
  );
}
