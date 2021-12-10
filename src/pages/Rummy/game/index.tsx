import Taro, { useDidShow, useShareAppMessage } from "@tarojs/taro";
import { View, MovableView, MovableArea } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "./index.scss";
import { useEffect, useRef, useState } from "react";
import { SLEEP } from "@/utils";
import {
  BOARD_COL_LEN,
  BOARD_ROW_LEN,
  getAreaPos,
  getBoxCross,
  getCardIndexByID,
  getCrossByCardPos,
  getGameData,
  getNewCardPosOnBoard,
  GROUND_COL_LEN,
  GROUND_ROW_LEN,
  handleCardList,
  INIT_PLAY_BOARD,
  INIT_PLAY_GROUND,
  judgeIn,
  judgePlaygroundPerfect,
  placeSetFromBoardToGround,
  sortCardList,
  tidyPlayground,
} from "./api";
import { RUMMY_AREA_STATUS } from "@/const";

interface Position {
  x: number;
  y: number;
}

export default function Index() {
  // 设置分享
  useShareAppMessage(() => {
    const title = "拉密牌";
    return {
      title,
      path: `/pages/Rummy/game/index`,
      // imageUrl: "https://cdn.renwuming.cn/static/yahtzee/imgs/cover.jpg",
    };
  });

  const [gameData, setGameData] = useState<any>(null);
  const [activeCardID, setActiveCardID] = useState<number>(-1);
  const [tinyCorrection, setTinyCorrection] = useState<number>(0.1);
  const [cardList, setCardList] = useState<Rummy.RummyCardData[]>([]);
  const [playgroundCardList, setPlaygroundCardList] = useState<
    Rummy.RummyCardData[]
  >([]);
  const [playgroundData, setPlaygroundData] = useState<Rummy.RummyCardData[][]>(
    INIT_PLAY_GROUND()
  );
  const [playboardData, setPlayboardData] = useState(INIT_PLAY_BOARD());

  const crossData = useRef(null);
  const cardAreaStatus = useRef<number>(RUMMY_AREA_STATUS.other);

  useEffect(() => {
    Promise.all([getGameData(), SLEEP(200)]).then(([newGameData]) => {
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
        // console.log(playground, playboard);

        // 更新游戏数据
        const gameData = newGameData;
        const { cardList, playgroundCardList } = gameData;
        setGameData(gameData);
        setPlaygroundCardList(playgroundCardList);
        const showCardList = handleCardList(cardList);
        updateCardList(showCardList);
      });
    });
  }, []);

  const { cardLibrary } = gameData || {};

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

      const { x, y } = pos;
      playgroundCardList[index].x = x;
      playgroundCardList[index].y = y;
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

      const { x, y } = pos;
      cardList[index].x = x;
      cardList[index].y = y;
      setCardList(cardList.concat());
    }
  }

  function updateCardList(cardList) {
    setCardList(cardList);
    cardList.forEach((card) => {
      const cross = getCrossByCardPos(card);
      handlePlaygroundAndPlayboard(cross, card);
    });
  }

  function handlePlaygroundAndPlayboard(cross, card) {
    const { id, areaStatus } = card;
    const { rowIndex, colIndex } = cross;
    playgroundData.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item && item.id === id) {
          playgroundData[i][j] = null;
        }
      });
    });
    playboardData.forEach((row, i) => {
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

  function endRound() {
    const perfect = judgePlaygroundPerfect(playgroundData);
    if (perfect) {
      Taro.showToast({
        title: "新的回合",
        icon: "success",
        duration: 1000,
      });

      // 固定公共区的牌
      const _playgroundCardList = [];
      for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
        for (let j = 0; j < GROUND_ROW_LEN; j++) {
          const card = playgroundData[i][j];
          if (card) {
            card.inGround = true;
            _playgroundCardList.push(card);
          }
        }
      }
      setCardList(cardList.filter((card) => !card.inGround));

      tidyPlayground(
        playgroundData,
        _playgroundCardList,
        setPlaygroundData,
        setPlaygroundCardList
      );
    } else {
      Taro.showToast({
        title: "失败",
        icon: "none",
        duration: 1000,
      });
    }
  }

  function addCard() {
    if (cardLibrary.length <= 0) return;
    const [newCard] = cardLibrary.splice(0, 1);
    setGameData({
      ...gameData,
      cardLibrary,
    });
    const newPos = getNewCardPosOnBoard(playboardData);
    cardList.push({
      ...newCard,
      ...newPos,
      areaStatus: RUMMY_AREA_STATUS.playboard,
    });
    updateCardList(cardList);
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
    for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
      for (let j = 0; j < GROUND_ROW_LEN; j++) {
        const card = playgroundData[i][j];
        if (card && !card.inGround) {
          card.areaStatus = RUMMY_AREA_STATUS.playboard;
        }
      }
    }
    execSortCardList();
  }

  return (
    <MovableArea>
      <View className="rummy-game">
        <View className="rummy-game-left">
          <View id="playground" className="playground">
            {new Array(GROUND_COL_LEN).fill(1).map((_, colIndex) => {
              let showIndex = false;
              if ([2, 5].includes(colIndex)) {
                showIndex = true;
              }
              return (
                <View className="row">
                  {new Array(GROUND_ROW_LEN).fill(1).map((_, rowIndex) => {
                    let indexValue;
                    if (rowIndex <= 3 || (rowIndex >= 5 && rowIndex <= 8)) {
                      indexValue = 4;
                    } else if (rowIndex >= 10) {
                      indexValue = rowIndex - 9;
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
          <View className="playboard-container">
            <View className="playboard-col">
              <AtButton
                className="ctrl-btn"
                onClick={() => {
                  execPlaceSetFromBoardToGround();
                }}
              >
                <AtIcon value="chevron-up" size="9" color="#fff"></AtIcon>
              </AtButton>
              <AtButton
                className="ctrl-btn"
                onClick={() => {
                  resetBoard();
                }}
              >
                <AtIcon value="chevron-down" size="9" color="#fff"></AtIcon>
              </AtButton>
            </View>
            <View className="playboard-wrapper">
              <View id="playboard" className="playboard">
                {new Array(BOARD_COL_LEN).fill(1).map((_) => {
                  return (
                    <View className="row">
                      {new Array(BOARD_ROW_LEN).fill(1).map((_) => {
                        return <View className="playground-box"></View>;
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
            <View className="playboard-col right">
              <AtButton
                className="ctrl-btn"
                onClick={() => {
                  execSortCardList();
                }}
              >
                <AtIcon value="numbered-list" size="9" color="#fff"></AtIcon>
              </AtButton>
              <AtButton className="ctrl-btn">
                <AtIcon value="settings" size="9" color="#fff"></AtIcon>
              </AtButton>
            </View>
          </View>
        </View>
        <View className="rummy-game-right">
          <View className="player-list"></View>
          <View className="round-btn-box">
            <AtButton
              className="round-ctrl-btn card"
              onClick={() => {
                addCard();
              }}
            >
              <AtIcon value="add-circle" size="14" color="#93d439"></AtIcon>
            </AtButton>
            <AtButton
              className="round-ctrl-btn card"
              onClick={() => {
                endRound();
              }}
            >
              <AtIcon value="check-circle" size="14" color="#93d439"></AtIcon>
            </AtButton>
          </View>
        </View>
        {cardList?.map(({ color, value, x, y, id }) => {
          return (
            <MovableView
              key={id}
              className={`card ${color} ${id === activeCardID ? "active" : ""}`}
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
              {value}
            </MovableView>
          );
        })}
        {playgroundCardList?.map((card) => {
          const { color, value, x, y, id } = card;
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
                {value}
              </MovableView>
            )
          );
        })}
      </View>
    </MovableArea>
  );
}
