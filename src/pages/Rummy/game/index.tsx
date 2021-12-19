import Taro, { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import {
  View,
  Text,
  MovableView,
  MovableArea,
  Image,
} from "@tarojs/components";
import { AtButton, AtIcon, AtProgress } from "taro-ui";
import "./index.scss";
import { useEffect, useRef, useState } from "react";
import { flat, getUserProfile, SLEEP } from "@/utils";
import {
  BOARD_COL_LEN,
  BOARD_ROW_LEN,
  getAreaPos,
  getBoxCross,
  getCardIndexByID,
  getCrossByCardPos,
  getGameData,
  getNewCardPosOnBoard,
  getResetCardPosOnBoard,
  GROUND_COL_LEN,
  GROUND_ROW_LEN,
  handleGameAction,
  handleGameData,
  initPlayboard,
  judgeIn,
  judgePlaygroundPerfect,
  placeSetFromBoardToGround,
  sortCardList,
  updateCardPos,
} from "./api";
import {
  AchievementGameIndex,
  PlayerContext,
  RUMMY_AREA_STATUS,
  RUMMY_ROUND_TIME_LIMIT,
  RUMMY_SHOW_ROUND_TIME_LIMIT,
} from "@/const";
import { useGameApi } from "@/utils_api";
import PlayerList from "@/Components/MartianPlayerList";
// @ts-ignore
import JokerIcon from "@/assets/imgs/rummy-joker.png";
import HallPlayer from "@/Components/HallPlayer";
import LoadPage from "@/Components/LoadPage";
import clsx from "clsx";
import { GameGift } from "@/Components/Gifts";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    return {
      title: `${nickName}邀请你来玩拉密牌！`,
      path: `/pages/Rummy/game/index?id=${id}`,
      imageUrl:
        "https://cdn.renwuming.cn/static/diceGames/imgs/rummy-cover.png",
    };
  });

  // cloud端
  const [players, setPlayers] = useState<Rummy.RummyPlayer[]>([]);
  const [gameData, setGameData] = useState<Rummy.RummyGameData>(null);
  const [roundCountDown, setRoundCountDown] = useState<number | string>(
    Infinity
  );
  const [cardList, setCardList] = useState<Rummy.RummyCardData[]>([]);
  const [playgroundData, setPlaygroundData] =
    useState<Rummy.RummyCardData[][]>(null);
  const [playboardData, setPlayboardData] = useState<Rummy.RummyCardData[][]>(
    initPlayboard()
  );
  const [playgroundCardList, setPlaygroundCardList] = useState<
    Rummy.RummyCardData[]
  >([]);
  // client端
  const [tinyCorrection, setTinyCorrection] = useState<number>(0.1);
  const [activeCardID, setActiveCardID] = useState<number>(-1);
  const crossData = useRef<Rummy.CrossData>(null);
  const cardAreaStatus = useRef<number>(RUMMY_AREA_STATUS.other);

  const {
    playerIndex,
    start,
    end,
    own,
    inGame,
    canJoin,
    roundSum,
    winner,
    inRound,
  } = gameData || {};
  const singlePlayer = players.length === 1;
  const gaming = start && !end;

  useGameApi({
    id,
    gameDbName: "rummy_games",
    initFn,
    gameDataWatchCb,
    getGameData,
    gameData,
    setRoundCountDown,
    getCountDown,
  });

  function getCountDown(data: Rummy.RummyGameBaseData) {
    const { roundTimeStamp } = data || {};
    if (!roundTimeStamp) return Infinity;
    const timeStamp = Date.now();
    const roundCountDown = Math.floor(
      RUMMY_ROUND_TIME_LIMIT - (timeStamp - +new Date(roundTimeStamp)) / 1000
    );
    return roundCountDown;
  }

  function initFn(data: Rummy.RummyGameBaseData) {
    const gameData = handleGameData(data);
    const { players, playgroundData, playgroundCardList, myCardList } =
      gameData;
    setGameData(gameData);
    setPlayers(players);
    setPlaygroundData(playgroundData);
    setPlaygroundCardList(playgroundCardList);

    updateCardList(myCardList, cardList, playgroundData);
  }

  function gameDataWatchCb(data: Rummy.RummyGameBaseData, updatedFields = []) {
    if (!data) return;
    const gameDataChange =
      updatedFields.filter(
        (key) =>
          !(key === "_updateTime" || /^players\.\d+\.timeStamp/.test(key))
      ).length > 0;
    if (gameDataChange) {
      const cardListPattern = new RegExp(`^players\.${playerIndex}\.cardList`);
      const boardChange = updatedFields.some((key) =>
        cardListPattern.test(key)
      );
      const groundChange = updatedFields.includes("playgroundData");
      // 结束回合不摸牌
      if (groundChange && boardChange) {
      }
      // 结束回合并摸牌
      else if (boardChange) {
      }
      initFn(data);
    } else {
      const gameData = handleGameData(data);
      const { players } = gameData;
      setPlayers(players);
    }
  }

  useEffect(() => {
    SLEEP(200).then(() => {
      const query = Taro.createSelectorQuery();
      query.select("#playground").boundingClientRect();
      query.select("#playboard").boundingClientRect();
      query.exec((res) => {
        const [playground, playboard] = res;
        const { left, top, width, height } = playground;
        // 存到 Storage
        Taro.setStorageSync("rummy_device_data", {
          playgroundPosData: {
            x: left,
            y: top,
            width,
            height,
          },
          playboardPosData: {
            x: playboard.left,
            y: playboard.top,
            width: playboard.width,
            height: playboard.height,
          },
          cardW: Math.floor(width / GROUND_ROW_LEN),
          cardH: Math.floor(height / GROUND_COL_LEN),
        });
        getGameData(id).then((data) => {
          initFn(data);
        });
      });
    });
  }, []);

  function onTouchStart(id) {
    setActiveCardID(id);
  }
  function onChange(event, id) {
    if (id !== activeCardID) return;
    const {
      detail: { x, y },
    } = event;

    const cardPosData = {
      x,
      y,
    };

    // 在公共面板中
    if (judgeIn(cardPosData, RUMMY_AREA_STATUS.playground)) {
      cardAreaStatus.current = RUMMY_AREA_STATUS.playground;
      const _crossData = getBoxCross(cardPosData, RUMMY_AREA_STATUS.playground);
      crossData.current = _crossData;
    }
    // 在玩家面板中
    else if (judgeIn(cardPosData, RUMMY_AREA_STATUS.playboard)) {
      cardAreaStatus.current = RUMMY_AREA_STATUS.playboard;
      const _crossData = getBoxCross(cardPosData, RUMMY_AREA_STATUS.playboard);
      crossData.current = _crossData;
    } else {
      cardAreaStatus.current = RUMMY_AREA_STATUS.other;
    }
  }
  function onTouchEnd() {
    if (!crossData.current) return;
    let pos;
    let index = getCardIndexByID(cardList, activeCardID);
    // 是否为公共牌
    const isGroundCard = index < 0;
    const { rowIndex, colIndex } = crossData.current;

    const targetInPlayGround =
      cardAreaStatus.current === RUMMY_AREA_STATUS.playground;
    const targetInPlayBoard =
      cardAreaStatus.current === RUMMY_AREA_STATUS.playboard;

    // 拖动公共牌
    if (isGroundCard) {
      index = getCardIndexByID(playgroundCardList, activeCardID);
      const targetIsValid =
        targetInPlayGround && !playgroundData[colIndex][rowIndex];

      // 拖动目标位置是有效的
      if (targetIsValid) {
        pos = getAreaPos(crossData.current, RUMMY_AREA_STATUS.playground);

        playgroundCardList[index].areaStatus = cardAreaStatus.current;
        handlePlaygroundAndPlayboard(
          crossData.current,
          playgroundCardList[index]
        );
      }
      // 否则，返回原位置
      else {
        pos = {
          x: playgroundCardList[index].x + tinyCorrection,
          y: playgroundCardList[index].y + tinyCorrection,
        };
        setTinyCorrection(-tinyCorrection);
      }

      playgroundCardList[index] = updateCardPos(playgroundCardList[index], pos);
      setPlaygroundCardList(playgroundCardList.concat());
    }
    // 拖动玩家手牌
    else {
      const targetIsValid =
        (targetInPlayGround && !playgroundData[colIndex][rowIndex]) ||
        (targetInPlayBoard && !playboardData[colIndex][rowIndex]);
      // 拖动目标位置是有效的
      if (targetIsValid) {
        if (targetInPlayGround) {
          pos = getAreaPos(crossData.current, RUMMY_AREA_STATUS.playground);
        } else if (targetInPlayBoard) {
          pos = getAreaPos(crossData.current, RUMMY_AREA_STATUS.playboard);
        }

        cardList[index].areaStatus = cardAreaStatus.current;
        handlePlaygroundAndPlayboard(crossData.current, cardList[index]);
      }
      // 否则，返回原位置
      else {
        pos = {
          x: cardList[index].x + tinyCorrection,
          y: cardList[index].y + tinyCorrection,
        };
        setTinyCorrection(-tinyCorrection);
      }

      cardList[index] = updateCardPos(cardList[index], pos);
      setCardList(cardList.concat());
    }
  }

  function updateCardList(
    cardList: Rummy.RummyCardData[],
    oldCardList: Rummy.RummyCardData[] = [],
    playgroundData: Rummy.RummyCardData[][] = null
  ) {
    // 排除公共区的牌
    const groundCardIDList = [];
    for (let i = 0; i < GROUND_COL_LEN; i++) {
      for (let j = 0; j < GROUND_ROW_LEN; j++) {
        const card = playgroundData?.[i][j];
        if (card) {
          groundCardIDList.push(card.id);
        }
      }
    }
    oldCardList = oldCardList.filter(
      (card) => !groundCardIDList.includes(card.id)
    );

    // 保留旧的卡片位置
    if (oldCardList.length > 0) {
      cardList = cardList.filter(
        (card) => getCardIndexByID(oldCardList, card.id) < 0
      );

      cardList.forEach((card) => {
        const pos = getNewCardPosOnBoard(playboardData);
        updateCardPos(card, pos);
      });

      cardList = cardList.concat(oldCardList);
    }
    setCardList(cardList);
    cardList.forEach((card) => {
      const cross = getCrossByCardPos(card);
      handlePlaygroundAndPlayboard(cross, card);
    });
  }

  function handlePlaygroundAndPlayboard(
    cross: Rummy.CrossData,
    card: Rummy.RummyCardData
  ) {
    const { id, areaStatus } = card;
    const { rowIndex, colIndex } = cross;
    playgroundData?.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item && item.id === id) {
          playgroundData[i][j] = null;
        }
      });
    });
    playboardData?.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item && item.id === id) {
          playboardData[i][j] = null;
        }
      });
    });
    if (areaStatus === RUMMY_AREA_STATUS.playground) {
      playgroundData[colIndex][rowIndex] = card;
      setPlaygroundData(playgroundData);
    } else if (areaStatus === RUMMY_AREA_STATUS.playboard) {
      playboardData[colIndex][rowIndex] = card;
      setPlayboardData(playboardData);
    }
  }

  async function endRound() {
    const perfect = judgePlaygroundPerfect(playgroundData);
    const groundCardIncreased =
      flat(playgroundData).filter((e) => e).length > playgroundCardList.length;
    if (!groundCardIncreased) {
      Taro.showToast({
        title: "请出牌",
        icon: "none",
        duration: 1000,
      });
    } else if (perfect) {
      await handleGameAction(id, "endRoundPerfect", { playgroundData });
    } else {
      Taro.showToast({
        title: "出牌失败",
        icon: "none",
        duration: 1000,
      });
    }
  }

  function addCard() {
    resetBoard();
    handleGameAction(id, "endRoundAddCard");
  }

  function execSortCardList() {
    const showCardList = sortCardList(cardList);
    updateCardList(showCardList);
  }

  function execPlaceSetFromBoardToGround() {
    placeSetFromBoardToGround(
      playboardData,
      playgroundData,
      cardList,
      setPlaygroundData,
      setCardList
    );
    cardList.forEach((card) => {
      const cross = getCrossByCardPos(card);
      handlePlaygroundAndPlayboard(cross, card);
    });
  }

  function resetBoard() {
    const resetList = [];
    for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
      for (let j = 0; j < GROUND_ROW_LEN; j++) {
        const card = playgroundData[i][j];
        if (card && !card.inGround) {
          card.areaStatus = RUMMY_AREA_STATUS.playboard;
          resetList.push(card);
        }
      }
    }
    const posList = getResetCardPosOnBoard(playboardData, resetList.length);
    resetList.forEach((card, index) => {
      const pos = posList[index];
      updateCardPos(card, pos);
    });
    updateCardList(cardList.concat());
  }

  function startBtnClick() {
    if (singlePlayer) {
      Taro.showModal({
        title: "开始单人游戏？",
        success: function (res) {
          if (res.confirm) {
            handleGameAction(id, "startGame");
          }
        },
      });
    } else {
      handleGameAction(id, "startGame");
    }
  }

  function restartRound() {
    resetBoard();
    getGameData(id).then((data) => {
      initFn(data);
    });
  }

  return (
    <MovableArea>
      <LoadPage></LoadPage>
      <GameGift />
      <View className="rummy-game">
        <View className="rummy-game-wrapper">
          <View className="rummy-game-top">
            <View id="playground" className="playground">
              {new Array(GROUND_COL_LEN).fill(1).map((_, colIndex) => {
                const show4 = colIndex <= 7 && colIndex % 3 === 0;
                const showN = colIndex > 7 && (colIndex - 8) % 3 === 0;
                const showIndex = show4 || showN;
                return (
                  <View className="row">
                    {new Array(GROUND_ROW_LEN).fill(1).map((_, rowIndex) => {
                      let indexValue;
                      if (show4) {
                        if (rowIndex >= 2 && rowIndex <= 10 && rowIndex !== 6) {
                          indexValue = 4;
                        }
                      } else {
                        indexValue = rowIndex + 1;
                      }
                      return (
                        <View className="playground-box">
                          {showIndex && indexValue}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
            <View className="rummy-game-right">
              <View className="player-list">
                <PlayerContext.Provider
                  value={{
                    gameID: id,
                    players,
                    playerIndex,
                    kickPlayer(openid) {
                      handleGameAction(id, "kickPlayer", {
                        openid,
                      });
                    },
                    initGameIndex: AchievementGameIndex.rummy,
                    showScore: start,
                    showSetting: own && !start,
                    showActive: start,
                    showOffline: !end,
                    showGift: !end && inGame,
                  }}
                >
                  <PlayerList players={players}></PlayerList>
                </PlayerContext.Provider>
                {singlePlayer && gaming && (
                  <View className="round-sum">
                    回合数
                    <Text className="number">{roundSum}</Text>
                  </View>
                )}
              </View>
              {gaming && (
                <View className="round-btn-box">
                  <AtButton
                    className="round-ctrl-btn card"
                    onClick={() => {
                      addCard();
                    }}
                    disabled={!inRound}
                  >
                    <AtIcon
                      value="add-circle"
                      size="22"
                      color="#93d439"
                    ></AtIcon>
                  </AtButton>
                  <AtButton
                    className="round-ctrl-btn card"
                    onClick={() => {
                      endRound();
                    }}
                    disabled={!inRound}
                  >
                    <AtIcon
                      value="check-circle"
                      size="22"
                      color="#93d439"
                    ></AtIcon>
                  </AtButton>
                </View>
              )}
            </View>
          </View>
          <View className="count-down-box">
            {gaming &&
              !singlePlayer &&
              roundCountDown <= RUMMY_SHOW_ROUND_TIME_LIMIT && (
                <AtProgress
                  percent={(+roundCountDown / 60) * 100}
                  status="error"
                />
              )}
          </View>
          <View
            className={clsx(
              "playboard-container",
              (!start || end) && "not-start"
            )}
          >
            <View className="playboard-col">
              {gaming && (
                <View>
                  <AtButton
                    className="ctrl-btn"
                    onClick={() => {
                      execPlaceSetFromBoardToGround();
                    }}
                  >
                    <AtIcon value="chevron-up" size="18" color="#fff"></AtIcon>
                  </AtButton>
                  <AtButton
                    className="ctrl-btn"
                    onClick={() => {
                      resetBoard();
                    }}
                  >
                    <AtIcon
                      value="chevron-down"
                      size="18"
                      color="#fff"
                    ></AtIcon>
                  </AtButton>
                </View>
              )}
            </View>
            <View
              className={clsx(
                "playboard-wrapper",
                !inGame && !singlePlayer && "hidden"
              )}
            >
              <View id="playboard" className="playboard">
                {new Array(BOARD_COL_LEN).fill(1).map((_) => {
                  return (
                    <View className="row">
                      {new Array(BOARD_ROW_LEN).fill(1).map((_) => {
                        return <View className="playboard-box"></View>;
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
            <View className="playboard-col right">
              {gaming && (
                <View>
                  <AtButton
                    className="ctrl-btn"
                    onClick={() => {
                      execSortCardList();
                    }}
                  >
                    <AtIcon
                      value="numbered-list"
                      size="18"
                      color="#fff"
                    ></AtIcon>
                  </AtButton>
                  <AtButton
                    className="ctrl-btn"
                    onClick={() => {
                      restartRound();
                    }}
                  >
                    <AtIcon value="reload" size="18" color="#fff"></AtIcon>
                  </AtButton>
                </View>
              )}
            </View>
            {gameData && !start && (
              <View className="before-start-btn-box">
                {own ? (
                  <View>
                    <AtButton
                      type="primary"
                      onClick={() => {
                        startBtnClick();
                      }}
                    >
                      开始
                    </AtButton>
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
            {end && (
              <View className="before-start-btn-box">
                {singlePlayer ? (
                  <View className="result-box">
                    <Text className="text">回合数</Text>
                    <Text className="number">{roundSum}</Text>
                  </View>
                ) : (
                  <View className="result-box">
                    <Text className="text">获胜者</Text>
                    <HallPlayer data={players?.[winner]}></HallPlayer>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
        {gaming &&
          cardList?.map(({ color, value, x, y, id }) => {
            const isJoker = value === 0;
            return (
              <MovableView
                key={id}
                className={`card ${color} ${
                  id === activeCardID ? "active" : ""
                }`}
                direction="all"
                onChange={(event) => {
                  onChange(event, id);
                }}
                onTouchStart={() => {
                  onTouchStart(id);
                }}
                onTouchEnd={onTouchEnd}
                x={x}
                y={y}
              >
                {isJoker ? (
                  <Image
                    className="card-img"
                    mode="aspectFit"
                    src={JokerIcon}
                  ></Image>
                ) : (
                  value
                )}
              </MovableView>
            );
          })}
        {playgroundCardList?.map((card) => {
          const { color, value, x, y, id } = card;
          const isJoker = value === 0;
          return (
            card && (
              <MovableView
                key={id}
                className={`card ${color} ${
                  id === activeCardID ? "active" : ""
                }`}
                direction="all"
                onChange={(event) => {
                  onChange(event, id);
                }}
                onTouchStart={() => {
                  onTouchStart(id);
                }}
                onTouchEnd={onTouchEnd}
                x={x}
                y={y}
              >
                {isJoker ? (
                  <Image
                    className="card-img"
                    mode="aspectFit"
                    src={JokerIcon}
                  ></Image>
                ) : (
                  value
                )}
              </MovableView>
            )
          );
        })}
      </View>
    </MovableArea>
  );
}
