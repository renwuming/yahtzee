import PlayerList from "@/Components/MartianPlayerList";
import Player from "@/Components/MartianPlayer";
import { AchievementGameIndex, PlayerContext, SET_TIME_LIMIT } from "@/const";
import { useGameApi } from "@/utils_api";
import { View, Image, Text } from "@tarojs/components";
import Taro, { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import { useState } from "react";
import { AtButton } from "taro-ui";
import {
  getGameData,
  getIndexof,
  handleGameAction,
  handleGameData,
  inList,
  judgeSetExists,
  submitSetCloud,
} from "./gameApi";
import "./index.scss";
import { getUserProfile } from "@/utils";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    return {
      title: `${nickName}邀请你来玩神奇形色牌！`,
      path: `/pages/Set/game/index?id=${id}`,
      imageUrl: "https://cdn.renwuming.cn/static/diceGames/imgs/set-cover.png",
    };
  });

  const [players, setPlayers] = useState<Set.SetPlayer[]>([]);
  const [gameData, setGameData] = useState<Set.GameData>(null);
  const [roundCountDown, setRoundCountDown] = useState<number | string>(
    Infinity
  );

  useGameApi({
    id,
    gameDbName: "set_games",
    initFn,
    gameDataWatchCb,
    getGameData,
    gameData,
    setRoundCountDown,
  });

  function initFn(data: Set.GameBaseData) {
    const gameData = handleGameData(data);
    const { players } = gameData;
    setPlayers(players);
    setGameData(gameData);
  }

  function gameDataWatchCb(data, updatedFields = []) {
    if (!data) return;
    const gameDataChange =
      updatedFields.filter(
        (key) =>
          !(key === "_updateTime" || /^players\.\d+\.timeStamp/.test(key))
      ).length > 0;
    if (gameDataChange) {
      if (updatedFields.includes("gameCardList")) {
        setSelectedCardList([]);
      }
      initFn(data);
    } else {
      const gameData = handleGameData(data);
      const { players } = gameData;
      setPlayers(players);
    }
  }

  const {
    gameCardList,
    reserveCardList,
    end,
    start,
    inGame,
    own,
    winners,
    canJoin,
    timer,
  } = gameData || {};

  const reserveCardsSum =
    (reserveCardList?.length || 0) +
      gameCardList?.filter((item) => !!item.color).length || "";

  const showGameCardList = start ? gameCardList : new Array(12).fill({});
  const singlePlayer = players.length === 1;
  const timerGameTxt = singlePlayer ? "单人竞技" : "多人竞技";
  const noTimerGameTxt = "单人练习";

  const [selectedCardList, setSelectedCardList] = useState<Set.SetCardData[]>(
    []
  );

  function selectCard(item: Set.SetCardData) {
    const index = getIndexof(selectedCardList, item);
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
    submitSetCloud(id, selectedCardList);
    setSelectedCardList([]);
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

  function startBtnClick(timer = true) {
    if (singlePlayer) {
      const title = `开始${timer ? timerGameTxt : noTimerGameTxt}？`;
      Taro.showModal({
        title,
        success: function (res) {
          if (res.confirm) {
            handleGameAction(id, "startGame", { timer });
          }
        },
      });
    } else {
      handleGameAction(id, "startGame", { timer });
    }
  }

  function kickPlayer(openid) {
    handleGameAction(id, "kickPlayer", {
      openid,
    });
  }

  return gameData ? (
    <View className="set-game">
      <PlayerContext.Provider
        value={{
          gameID: id,
          players,
          playerIndex: 0,
          kickPlayer,
          initGameIndex: AchievementGameIndex.set,
          showScore: start,
          showSetting: own && !start,
          showActive: start,
          showOffline: !end,
          showGift: !end && inGame,
          noNickName: true,
        }}
      >
        <PlayerList players={players}></PlayerList>
      </PlayerContext.Provider>
      <View className="card-box at-row at-row__align--center">
        {showGameCardList?.map((item) => {
          const { color, shape, fill, n } = item;
          const selected = inList(selectedCardList, item);
          const nlist = new Array(n).fill(0);
          const notEmpty = color && shape && fill;
          return (
            <View className={`card-item ${selected ? "selected" : ""}`}>
              {notEmpty ? (
                <AtButton
                  onClick={() => {
                    if (end) return;
                    selectCard(item);
                  }}
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
              ) : (
                <View className="empty"></View>
              )}
            </View>
          );
        })}
      </View>
      <View className="info-box at-row at-row__align--center">
        <View className="reserve-num-box">
          <Text className="text">剩余卡牌</Text>
          <Text className="number">{reserveCardsSum}</Text>
        </View>
        {timer && start && !end && (
          <View className="reserve-num-box count-down-box">
            <Text className="text">剩余时间</Text>
            {/* 倒计时小于一定时间再显示，避免回合切换时的突兀 */}
            {roundCountDown <= SET_TIME_LIMIT && (
              <View
                className={`count-down ${roundCountDown < 10 ? "error" : ""}`}
              >
                {roundCountDown}
              </View>
            )}
          </View>
        )}
      </View>

      {end ? (
        singlePlayer ? (
          <View className="result-box">
            <Text className="text">游戏结束</Text>
          </View>
        ) : winners.length > 0 ? (
          <View className="result-box">
            <Text className="text">获胜者</Text>
            {winners.map((index) => {
              const data = players[index];
              return <Player data={data}></Player>;
            })}
          </View>
        ) : (
          <View className="result-box">
            <Text className="text">游戏超时</Text>
          </View>
        )
      ) : start ? (
        <View className="ctrl-box">
          <View className="card-box at-row at-row__align--center">
            {selectedCardList.map((item) => {
              const { color, shape, fill, n } = item;
              const nlist = new Array(n).fill(0);
              return (
                <View className={`card-item`}>
                  <AtButton
                    onClick={() => {
                      if (end) return;
                      selectCard(item);
                    }}
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
            SET ！
          </AtButton>
          {timer ? null : (
            <AtButton
              type="secondary"
              onClick={() => {
                showTips();
              }}
            >
              提示
            </AtButton>
          )}
        </View>
      ) : (
        <View className="ctrl-box before-start">
          {own ? (
            <View>
              <AtButton
                type="primary"
                onClick={() => {
                  startBtnClick();
                }}
              >
                {timerGameTxt}
              </AtButton>
              {singlePlayer && (
                <AtButton
                  type="primary"
                  onClick={() => {
                    startBtnClick(false);
                  }}
                >
                  {noTimerGameTxt}
                </AtButton>
              )}
            </View>
          ) : inGame ? (
            <AtButton
              type="secondary"
              onClick={() => {
                getUserProfile(() => {
                  handleGameAction(id, "leaveGame");
                });
              }}
            >
              离开
            </AtButton>
          ) : (
            <AtButton
              type="secondary"
              onClick={() => {
                getUserProfile(() => {
                  handleGameAction(id, "joinGame");
                });
              }}
              disabled={!canJoin}
            >
              加入
            </AtButton>
          )}
          <AtButton type="secondary" openType="share">
            邀请朋友
          </AtButton>
        </View>
      )}
    </View>
  ) : null;
}
