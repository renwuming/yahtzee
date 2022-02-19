import Taro, { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import {
  View,
  Text,
  MovableView,
  MovableArea,
  Image,
} from "@tarojs/components";
import { AtButton, AtIcon, AtProgress, AtToast } from "taro-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { flat, getUserProfile, SLEEP } from "@/utils";
import {
  AchievementGameIndex,
  CARD_SUM,
  EXTRA_ROUND_TIME,
  getExtraRoundTimePrice,
  MAX_PLAYERS,
  PlayerContext,
  RUMMY_AREA_STATUS,
  RUMMY_ROUND_TIME_LIMIT,
  RUMMY_SHOW_ROUND_TIME_LIMIT,
} from "@/const";
import { useGameApi } from "@/utils_api";
// @ts-ignore
import PokerIcon from "@/assets/imgs/rummy-poker.png";
// @ts-ignore
import PerfectIcon from "@/assets/imgs/rummy-right.png";
// @ts-ignore
import AimIcon from "@/assets/imgs/aim.png";
// @ts-ignore
import MsgIcon from "@/assets/imgs/msg.png";
// @ts-ignore
import NoticeIcon from "@/assets/imgs/notice.png";
// @ts-ignore
import NoNoticeIcon from "@/assets/imgs/no-notice.png";
// @ts-ignore
import SandClockIcon from "@/assets/imgs/sandClock.png";
// @ts-ignore
import GoldIcon from "@/assets/imgs/gold.png";
import RummyCard from "@/Components/RummyCard";
import LoadPage from "@/Components/LoadPage";
import { GameGift } from "@/Components/Gifts";
import PlayerList from "@/Components/CommonPlayerList";
import RummyResultList from "@/Components/RummyResultList";
import Chat from "@/Components/Chat";
import {
  BOARD_ROW_LEN,
  CARD_LIBRARY,
  getAreaPos,
  getBoxCross,
  getCardIndexByID,
  getCrossByCardPos,
  getGameData,
  getNearestEmptyCross,
  getNewCardPosOnBoard,
  getResetCardPosOnBoard,
  GROUND_COL_LEN,
  GROUND_ROW_LEN,
  handleGameAction,
  handleGameData,
  increaseRoundTime,
  initPlayboard,
  judgeIn,
  judgePlaygroundPerfect,
  placeSetFromBoardToGround,
  sortCardList,
  updateCardPos,
} from "./api";
import "./index.scss";

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
  const [roundCountDown, setRoundCountDown] = useState<number>(Infinity);
  const [extraRoundFlag, setExtraRoundFlag] = useState<boolean>(false);
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
  const [resetWatchersFlag, setResetWatchersFlag] = useState<boolean>(false);
  const [activePlayer, setActivePlayer] = useState<number>(0);
  const activeCardID = useRef<number>(-1);
  const posData = useRef<Rummy.Position>(null);
  const [errList, setErrList] = useState<number[]>([]);
  const [toastText, setToastText] = useState<string>("");
  const [toastIsOpen, setToastIsOpen] = useState<boolean>(false);
  const [correctToastIsOpen, setCorrectToastIsOpen] = useState<boolean>(false);
  const [toastStatus, setToastStatus] = useState<
    "error" | "loading" | "success"
  >("error");
  const waiting = useRef<boolean>(false);
  const [drawerShow, setDrawerShow] = useState<boolean>(false);
  const [showBarrage, setShowBarrage] = useState<boolean>(true);

  const {
    playerIndex,
    start,
    end,
    own,
    inGame,
    canJoin,
    inRound,
    cardLibrary,
    extraRoundTime,
    roundSum,
  } = gameData || {};
  const singlePlayer = players.length === 1;
  const gaming = start && !end;
  const groundCardSum = CARD_SUM - cardLibrary?.length;
  const gameDataLoaded = players.length >= 1;
  // 回合时间相关
  const hasExtraTime = extraRoundTime?.[roundSum];
  const extraTime = extraRoundFlag ? EXTRA_ROUND_TIME : 0;
  const showRoundTimeLimit = RUMMY_SHOW_ROUND_TIME_LIMIT + extraTime;
  const canBuyExtraRoundTime =
    gaming && !singlePlayer && inRound && !hasExtraTime && +roundCountDown >= 1;
  // 存在手牌在公共区域
  const handCardInGround = cardList.some(
    (item) => item.areaStatus === RUMMY_AREA_STATUS.playground
  );

  const MemoCardList = useMemo(
    () => (
      <CardList
        gaming={gaming}
        gameData={gameData}
        cardList={cardList}
        playgroundCardList={playgroundCardList}
        errList={errList}
        activeCardID={activeCardID}
        onChange={onChange}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      ></CardList>
    ),
    [
      gaming,
      gameData,
      cardList,
      playgroundCardList,
      errList,
      activeCardID.current,
    ]
  );

  useGameApi({
    id,
    gameDbName: "rummy_games",
    initFn,
    gameDataWatchCb,
    getGameData,
    gameData,
    setRoundCountDown,
    getCountDown,
    resetWatchersFlag,
  });

  function getCountDown(data: Rummy.RummyGameBaseData): number {
    const { roundTimeStamp, extraRoundTime, roundSum } = data || {};
    if (!roundTimeStamp) return Infinity;
    const extraRoundFlag = extraRoundTime?.[roundSum];
    setExtraRoundFlag(extraRoundFlag);
    const extraTime = extraRoundFlag ? EXTRA_ROUND_TIME : 0;
    const roundTimeLimit = RUMMY_ROUND_TIME_LIMIT + extraTime;
    const timeStamp = Date.now();
    const _roundCountDown = ~~(
      roundTimeLimit -
      (timeStamp - +new Date(roundTimeStamp)) / 1000
    );
    return _roundCountDown;
  }

  function initFn(
    data: Rummy.RummyGameBaseData,
    resetBoardFlag: boolean = false
  ) {
    const gameData = handleGameData(data);
    const { players, playgroundData, playgroundCardList, myCardList } =
      gameData;
    setGameData(gameData);
    setPlayers(players);
    setPlaygroundData(playgroundData.concat());
    setPlaygroundCardList(playgroundCardList.concat());
    const list = updateCardList(myCardList, cardList, playgroundData);
    if (resetBoardFlag) {
      resetBoard(false, playgroundData, list);
    }
  }

  function gameDataWatchCb(data: Rummy.RummyGameBaseData, updatedFields = []) {
    if (!data) return;
    updatedFields = updatedFields.filter(
      (key) => !(key === "_updateTime" || /^players\.\d+\.timeStamp/.test(key))
    );
    // 自己所在回合，忽略临时变化的 roundPlaygroundData
    if (inRound) {
      updatedFields = updatedFields.filter(
        (key) => key !== "roundPlaygroundData"
      );
    }
    const gameDataChange = updatedFields.length > 0;
    if (gameDataChange) {
      // 只有回合时间相关更新
      const OnlyRoundTimeChange = updatedFields.every(
        (key) =>
          /^players\.\d+\.actionRecord/.test(key) ||
          /^extraRoundTime\.\d+/.test(key)
      );
      if (OnlyRoundTimeChange) {
        const _gameData = handleGameData(data);
        const { players, extraRoundTime } = _gameData;
        setPlayers(players);
        setGameData({
          ...gameData,
          extraRoundTime,
        });
      } else {
        initFn(data, true);
      }
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
      query.select("#cardLibrary").boundingClientRect();
      query.exec((res) => {
        const [playground, playboard, cardLibrary] = res;
        const { left, top, width, height } = playground;
        // 存到 Storage
        Taro.setStorageSync("rummy_device_data", {
          playgroundPosData: {
            x: ~~left,
            y: ~~top,
            width: ~~width,
            height: ~~height,
          },
          playboardPosData: {
            x: ~~playboard.left,
            y: ~~playboard.top,
            width: ~~playboard.width,
            height: ~~playboard.height,
          },
          cardW: width / GROUND_ROW_LEN,
          cardH: height / GROUND_COL_LEN,
          cardLibraryPosData: {
            x: cardLibrary.left,
            y: cardLibrary.top,
            width: cardLibrary.width,
            height: cardLibrary.height,
          },
        });
        getGameData(id).then((data) => {
          initFn(data);
        });
      });
    });
  }, []);

  useEffect(() => {
    SLEEP(200).then(() => {
      const query = Taro.createSelectorQuery();
      // 初始化所有玩家的头像位置，存入Storage
      const PLAY_NUM = MAX_PLAYERS;
      for (let i = 0; i < PLAY_NUM; i++) {
        const avatarDom = `#player-${i}-avatar`;
        query.select(avatarDom).boundingClientRect();
      }
      query.exec((avatarPosList) => {
        avatarPosList.forEach((data, i) => {
          if (data) {
            Taro.setStorageSync(
              `rummy-player-${players.length}-${i}-avatar-pos`,
              data
            );
          }
        });

        getGameData(id).then((data) => {
          initFn(data);
        });
      });
    });
  }, [players.length, start]);

  function onTouchStart(id: number) {
    activeCardID.current = id;
  }
  function onChange(event) {
    const {
      detail: { x, y, source },
    } = event;
    if (!source) return;

    posData.current = {
      x,
      y,
    };
  }
  async function onTouchEnd(id: number) {
    if (id !== activeCardID.current) return;
    let index = getCardIndexByID(cardList, id);
    // 是否为公共牌
    const isGroundCard = index < 0;

    let crossData;
    let cardAreaStatus;
    // 在公共面板中
    if (judgeIn(posData.current, RUMMY_AREA_STATUS.playground)) {
      cardAreaStatus = RUMMY_AREA_STATUS.playground;
      crossData = getBoxCross(posData.current, RUMMY_AREA_STATUS.playground);
    }
    // 在玩家面板中
    else if (judgeIn(posData.current, RUMMY_AREA_STATUS.playboard)) {
      cardAreaStatus = RUMMY_AREA_STATUS.playboard;
      crossData = getBoxCross(posData.current, RUMMY_AREA_STATUS.playboard);
    } else {
      cardAreaStatus = RUMMY_AREA_STATUS.other;
    }

    const targetInPlayGround = cardAreaStatus === RUMMY_AREA_STATUS.playground;
    const targetInPlayBoard = cardAreaStatus === RUMMY_AREA_STATUS.playboard;
    let pos;

    // 拖动公共牌
    if (isGroundCard) {
      index = getCardIndexByID(playgroundCardList, id);
      // 自己回合才可以拖动公共牌
      const targetIsValid = inRound && !end && targetInPlayGround;

      let _crossData = null;
      if (targetIsValid) {
        _crossData = getNearestEmptyCross(
          RUMMY_AREA_STATUS.playground,
          crossData,
          id,
          playgroundData
        );
      }

      // 拖动目标位置是有效的
      if (targetIsValid && _crossData) {
        pos = getAreaPos(_crossData, RUMMY_AREA_STATUS.playground);

        playgroundCardList[index].areaStatus = cardAreaStatus;
        handlePlaygroundAndPlayboard(_crossData, playgroundCardList[index]);
      }
      // 否则，返回原位置
      else {
        pos = {
          x: playgroundCardList[index].x,
          y: playgroundCardList[index].y,
        };
      }
      playgroundCardList[index] = updateCardPos(playgroundCardList[index], pos);
      setPlaygroundCardList(playgroundCardList.concat());
    }
    // 拖动玩家手牌
    else {
      // 自己回合才可以拖动手牌到公共区
      const targetIsValid =
        (inRound && targetInPlayGround) || targetInPlayBoard;

      let _crossData = null;
      if (targetIsValid) {
        _crossData = getNearestEmptyCross(
          targetInPlayGround
            ? RUMMY_AREA_STATUS.playground
            : RUMMY_AREA_STATUS.playboard,
          crossData,
          id,
          targetInPlayGround ? playgroundData : playboardData
        );
      }

      // 拖动目标位置是有效的
      if (targetIsValid && _crossData) {
        if (targetInPlayGround) {
          pos = getAreaPos(_crossData, RUMMY_AREA_STATUS.playground);
        } else if (targetInPlayBoard) {
          pos = getAreaPos(_crossData, RUMMY_AREA_STATUS.playboard);
        }

        cardList[index].areaStatus = cardAreaStatus;
        handlePlaygroundAndPlayboard(_crossData, cardList[index]);
      }
      // 否则，返回原位置
      else {
        pos = {
          x: cardList[index].x,
          y: cardList[index].y,
        };
      }

      cardList[index] = updateCardPos(cardList[index], pos);
      setCardList(cardList.concat());
    }
    activeCardID.current = -1;
    updateRoundPlaygroundData();
  }

  function updateCardList(
    cardList: Rummy.RummyCardData[],
    oldCardList: Rummy.RummyCardData[] = [],
    _playgroundData: Rummy.RummyCardData[][] = playgroundData
  ) {
    // 排除公共区的牌
    const groundCardIDList = [];
    for (let i = 0; i < GROUND_COL_LEN; i++) {
      for (let j = 0; j < GROUND_ROW_LEN; j++) {
        const card = _playgroundData?.[i][j];
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
      // 正在被移动的卡片的位置不作处理
      if (card.id === activeCardID.current) return;

      const cross = getCrossByCardPos(card);
      handlePlaygroundAndPlayboard(cross, card, _playgroundData);
    });
    return cardList;
  }

  function handlePlaygroundAndPlayboard(
    cross: Rummy.CrossData,
    card: Rummy.RummyCardData,
    _playgroundData: Rummy.RummyCardData[][] = playgroundData
  ) {
    if (!_playgroundData || !playboardData) return;
    const { id, areaStatus } = card;
    const { rowIndex, colIndex } = cross;
    _playgroundData.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item && item.id === id) {
          _playgroundData[i][j] = null;
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
      _playgroundData[colIndex][rowIndex] = card;
      setPlaygroundData(_playgroundData);
    } else if (areaStatus === RUMMY_AREA_STATUS.playboard) {
      playboardData[colIndex][rowIndex] = card;
      setPlayboardData(playboardData);
    }
  }

  async function endRound() {
    const groundCardIncreased =
      flat(playgroundData).filter((e) => e).length > playgroundCardList.length;
    if (!groundCardIncreased) {
      showToast("请出牌");
      return;
    }

    const errList = judgePlaygroundPerfect(playgroundData);
    if (errList) {
      showToast("出牌失败");
      setErrList(errList.map((card) => card.id));
      setTimeout(() => {
        setErrList([]);
      }, 2000);
    } else {
      await handleGameAction(
        id,
        "endRoundPerfect",
        { playgroundData },
        showToast
      );
    }
  }

  async function addCard() {
    if (waiting.current) return;
    waiting.current = true;
    resetBoard();
    await handleGameAction(id, "endRoundAddCard");
    waiting.current = false;
  }

  async function execSortCardList(straightSortFirst: boolean = false) {
    const showCardList = sortCardList(cardList, straightSortFirst);
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

    updateRoundPlaygroundData();
  }

  // 更新本回合的临时 playgroundData
  function updateRoundPlaygroundData() {
    if (!inRound) return;
    handleGameAction(id, "updateRoundPlaygroundData", {
      playgroundData,
    });
  }

  function resetBoard(
    updateRoundPlaygroundDataFlag: boolean = false,
    _playgroundData: Rummy.RummyCardData[][] = playgroundData,
    _cardList: Rummy.RummyCardData[] = cardList
  ) {
    const resetList = [];
    for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
      for (let j = 0; j < GROUND_ROW_LEN; j++) {
        const card = _playgroundData[i][j];
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
    updateCardList(_cardList.concat());
    if (updateRoundPlaygroundDataFlag) {
      updateRoundPlaygroundData();
    }
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
    resetBoard(true);
    setResetWatchersFlag(!resetWatchersFlag);
    getGameData(id).then((data) => {
      initFn(data);
    });
  }

  function showToast(
    text: string,
    time: number = 1500,
    status: "error" | "loading" | "success" = "error"
  ) {
    setToastText(text);
    setToastIsOpen(true);
    setToastStatus(status);
    setTimeout(() => {
      setToastIsOpen(false);
    }, time);
  }

  function correctCardsPos() {
    setCorrectToastIsOpen(true);
    setTimeout(() => {
      setCorrectToastIsOpen(false);
    }, 500);
  }

  return (
    <MovableArea>
      <LoadPage></LoadPage>
      <Chat
        gameID={id}
        drawerShow={drawerShow}
        setDrawerShow={setDrawerShow}
        showBarrage={showBarrage}
      ></Chat>
      <GameGift />
      <View className="rummy-game">
        <View className="rummy-game-wrapper">
          <View
            className={clsx("rummy-game-top", gameDataLoaded && !end && "show")}
          >
            <View className="rummy-game-left">
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
                    noNickName: true,
                    onItemClick(index) {
                      setActivePlayer(index);
                    },
                    activePlayer,
                  }}
                >
                  <PlayerList players={players}></PlayerList>
                </PlayerContext.Provider>
                {gaming && singlePlayer && (
                  <View className="round-sum">
                    用牌数
                    <Text className="number">{groundCardSum}</Text>
                  </View>
                )}
              </View>
              {gaming && !singlePlayer && inGame && (
                <View className="action-box">
                  <AtButton
                    className="extra-time-btn"
                    onClick={async () => {
                      if (waiting.current) return;
                      waiting.current = true;
                      await increaseRoundTime(
                        id,
                        showToast,
                        getExtraRoundTimePrice(players[playerIndex])
                      );
                      waiting.current = false;
                    }}
                    disabled={!canBuyExtraRoundTime}
                  >
                    <Image src={SandClockIcon} mode="aspectFit" />
                    <View className="bottom">
                      <Image className="icon" src={GoldIcon} mode="aspectFit" />
                      <Text>
                        {getExtraRoundTimePrice(players[playerIndex])}
                      </Text>
                    </View>
                  </AtButton>
                </View>
              )}
            </View>
            <View
              id="playground"
              className="playground"
              onLongPress={() => {
                gaming && correctCardsPos();
              }}
            >
              {new Array(GROUND_COL_LEN).fill(1).map((_, colIndex) => {
                const show4 = colIndex <= 5 && colIndex % 3 === 0;
                const showN = colIndex > 5 && (colIndex - 8) % 3 === 0;
                const showIndex = show4 || showN;
                return (
                  <View key={colIndex} className="row">
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
                        <View key={rowIndex} className="playground-box">
                          {showIndex && indexValue}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
          <View className={clsx("count-down-box", inRound && "my-count-down")}>
            {gaming &&
              !singlePlayer &&
              +roundCountDown <= showRoundTimeLimit && (
                <AtProgress
                  percent={(+roundCountDown / showRoundTimeLimit) * 100}
                  status="error"
                />
              )}
          </View>
          <View
            className={clsx("playboard-container", !gaming && "hidden")}
            onLongPress={() => {
              gaming && correctCardsPos();
            }}
          >
            <View className={clsx("top", gaming && "show")}>
              <View className="playboard-ctrl-box">
                <AtButton
                  className="ctrl-btn"
                  onClick={() => {
                    restartRound();
                  }}
                >
                  <AtIcon value="reload" size="18" color="#fff"></AtIcon>
                </AtButton>
                <AtButton
                  className="ctrl-btn"
                  onClick={() => {
                    correctCardsPos();
                  }}
                  disabled={!inRound}
                >
                  <Image src={AimIcon} mode="aspectFit" />
                </AtButton>
              </View>
              <View className={clsx("playboard-wrapper")}>
                <View id="playboard" className="playboard">
                  {new Array(BOARD_ROW_LEN).fill(1).map((_, rowIndex) => (
                    <View key={rowIndex} className="playboard-box"></View>
                  ))}
                </View>
              </View>
              <View className="playboard-ctrl-box">
                <AtButton
                  className="ctrl-btn"
                  onClick={() => {
                    execSortCardList();
                  }}
                  disabled={!inGame}
                >
                  <Text className="text-icon">777</Text>
                </AtButton>
                <AtButton
                  className="ctrl-btn"
                  onClick={() => {
                    execSortCardList(true);
                  }}
                  disabled={!inGame}
                >
                  <Text className="text-icon">789</Text>
                </AtButton>
              </View>
            </View>
            <View className={clsx("bottom", gaming && "show")}>
              <AtButton
                className="icon-btn"
                onClick={() => {
                  setDrawerShow(true);
                }}
              >
                <Image src={MsgIcon} mode="aspectFit" />
              </AtButton>
              {handCardInGround ? (
                <AtButton
                  className="ctrl-btn round-ctrl-btn-sm"
                  onClick={() => {
                    restartRound();
                  }}
                >
                  <AtIcon value="reload" size="18" color="#fff"></AtIcon>
                </AtButton>
              ) : (
                <AtButton
                  className="ctrl-btn round-ctrl-btn-sm"
                  onClick={() => {
                    execPlaceSetFromBoardToGround();
                  }}
                  disabled={!inRound}
                >
                  <AtIcon value="arrow-up" size="18" color="#fff"></AtIcon>
                </AtButton>
              )}
              <AtButton
                className="ctrl-btn round-ctrl-btn"
                onClick={() => {
                  handCardInGround ? endRound() : addCard();
                }}
                disabled={!inRound}
              >
                {handCardInGround ? (
                  <Image src={PerfectIcon} mode="aspectFit"></Image>
                ) : (
                  <View className="btn-box">
                    <AtIcon value="add" size="22" color="#f8f6d1"></AtIcon>
                    <Image
                      id="cardLibrary"
                      className="add-icon"
                      mode="aspectFit"
                      src={PokerIcon}
                    ></Image>
                    <Text className="library-num">{cardLibrary?.length}</Text>
                  </View>
                )}
              </AtButton>
              <AtButton
                className="icon-btn icon-btn2"
                onClick={() => {
                  setShowBarrage(!showBarrage);
                }}
              >
                {showBarrage ? (
                  <Image src={NoticeIcon} mode="aspectFit" />
                ) : (
                  <Image src={NoNoticeIcon} mode="aspectFit" />
                )}
              </AtButton>
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
          </View>
        </View>
        <AtToast
          text="校准位置"
          status="success"
          isOpened={correctToastIsOpen}
        ></AtToast>
        <AtToast
          isOpened={toastIsOpen}
          text={toastText}
          status={toastStatus}
        ></AtToast>
        {MemoCardList}
      </View>

      {end && (
        <View className="result-box">
          <RummyResultList data={gameData}></RummyResultList>
        </View>
      )}
    </MovableArea>
  );
}

interface CardListProps {
  gaming: boolean;
  gameData: Rummy.RummyGameData;
  cardList: Rummy.RummyCardData[];
  playgroundCardList: Rummy.RummyCardData[];
  errList: number[];
  activeCardID: React.MutableRefObject<number>;
  onChange: any;
  onTouchStart: any;
  onTouchEnd: any;
}
function CardList({
  gaming,
  gameData,
  cardList,
  playgroundCardList,
  errList,
  activeCardID,
  onChange,
  onTouchStart,
  onTouchEnd,
}: CardListProps) {
  const { end, players } = gameData || {};
  return (
    <View>
      {end
        ? null
        : CARD_LIBRARY.map((id) => {
            // if (id === 0) console.log('开始重新渲染卡片列表......');
            const playerCard = gaming
              ? cardList?.find((card) => card.id === id)
              : null;
            const groundCard = playgroundCardList?.find(
              (card) => card.id === id
            );

            let otherPlayerCard;
            if (!playerCard && !groundCard) {
              for (let i = 0; i < players?.length; i++) {
                const { cardList } = players[i];
                otherPlayerCard = cardList?.find((card) => card.id === id);
                if (otherPlayerCard) {
                  const { left, top } =
                    Taro.getStorageSync(
                      `rummy-player-${players.length}-${i}-avatar-pos`
                    ) || {};
                  otherPlayerCard.x = left;
                  otherPlayerCard.y = top;
                  break;
                }
              }
            }

            let isLibrary = false;
            let noValue = false;
            let cardData;
            if (playerCard) {
              cardData = playerCard;
            } else if (groundCard) {
              cardData = groundCard;
            } else if (otherPlayerCard) {
              cardData = otherPlayerCard;
              noValue = true;
            } else {
              const { cardLibraryPosData } =
                Taro.getStorageSync("rummy_device_data");
              cardData = {
                id,
                x: cardLibraryPosData?.x,
                y: cardLibraryPosData?.y,
              };
              noValue = true;
              isLibrary = true;
            }
            if (!cardData) return null;

            const { x, y, inGroundTemp } = cardData;

            const isErr = errList.includes(id);
            return (
              <MovableView
                key={id}
                className={clsx(
                  "card-wrapper",
                  otherPlayerCard
                    ? "bottom"
                    : id === activeCardID.current && "active",
                  isLibrary && "hidden"
                )}
                direction="all"
                onChange={(event) => {
                  onChange(event, id);
                }}
                onTouchStart={() => {
                  onTouchStart(id);
                }}
                onTouchEnd={() => {
                  onTouchEnd(id);
                }}
                x={x}
                y={y}
              >
                <RummyCard
                  data={cardData}
                  inGround={!groundCard || inGroundTemp}
                  isErr={isErr}
                  noValue={noValue}
                ></RummyCard>
              </MovableView>
            );
          })}
    </View>
  );
}
