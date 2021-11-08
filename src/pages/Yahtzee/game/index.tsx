import Taro from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import {
  getCurrentInstance,
  useDidHide,
  useDidShow,
  useShareAppMessage,
} from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { AtButton, AtFab, AtModal } from "taro-ui";

import "./index.scss";
import {
  AchievementGameIndex,
  ACTION_DELAY,
  DEFAULT_DICE_LIST,
  DEFAULT_SCORES,
  DICE_CHANCES_NUM,
  DICE_NUM,
  PlayerContext,
  ROUND_TIME_LIMIT,
  SHOW_ROUND_TIME_LIMIT,
} from "../../../const";
import PlayerList from "../../../Components/PlayerList";
import DiceList from "../../../Components/YahtzeeDiceList";
import RatingTable from "../../../Components/YahtzeeRatingTable";
import Player from "../../../Components/Player";
import LoadPage from "../../../Components/LoadPage";

import {
  getUserProfile,
  gotoYahtzeeGuide,
  SLEEP,
  watchDataBase,
} from "@/utils";
import { execGiftActions, watchEvents_DataBase } from "@/utils_api";
import {
  getGameData,
  handleGameData,
  joinGame,
  kickFromGame,
  leaveGame,
  startGame,
  updateGame,
  updateGameScores,
  updatePlayerOnline_Database,
} from "./gameApi";
import { GameGift } from "../../../Components/Gifts";

export default function Index() {
  // 页面参数
  const id = getCurrentInstance()?.router?.params?.id;
  const { nickName } = Taro.getStorageSync("userInfo");
  // 设置分享
  useShareAppMessage(() => {
    const title = nickName
      ? `${nickName}邀请你来快艇骰子！`
      : "快艇骰子，一决高下！";
    return {
      title,
      path: `/pages/Yahtzee/game/index?id=${id}`,
      imageUrl: "https://cdn.renwuming.cn/static/yahtzee/imgs/share.png",
    };
  });

  const [waiting, setWaiting] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameData>(null);
  const [pageShow, setPageShow] = useState<boolean>(true);
  const [dicing, setDicing] = useState<boolean>(false);
  const [showDicing, setShowDicing] = useState<boolean>(false);
  const [confirmFlag, setConfirmFlag] = useState<boolean>(false);
  const [newScore, setNewScore] = useState<NewScore>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [diceList, setDiceList] = useState<DiceData[]>(DEFAULT_DICE_LIST);
  const [showConfirmStartModal, setShowConfirmStartModal] =
    useState<boolean>(false);
  const [roundCountDown, setRoundCountDown] = useState<number | string>(100);

  const {
    start,
    own,
    inGame,
    inRound,
    chances,
    roundPlayer,
    end,
    winner,
    roundTimeStamp,
    roundScores: scores,
    playerIndex,
  } = gameData || {
    otherScores: DEFAULT_SCORES,
  };

  const cb = useRef(null);
  cb.current = (data, updatedFields = []) => {
    if (dicing) return;
    const gameDataChange =
      updatedFields.filter(
        (key) => !(key === "_updateTime" || /^players\.\d/.test(key))
      ).length > 0;
    if (gameDataChange) {
      init(data);
    } else {
      const gameData = handleGameData(data);
      const { players } = gameData;
      setPlayers(players);
    }
  };

  useDidHide(() => {
    setPageShow(false);
  });
  useDidShow(() => {
    // 进入页面时初始化数据
    const id = getCurrentInstance()?.router?.params?.id;
    getGameData(id).then((data) => {
      init(data);
    });
    setPageShow(true);
  });

  // 监听dicing状态变化
  useEffect(() => {
    if (dicing) return;
    getGameData(id).then((data) => {
      init(data);
    });
  }, [dicing]);

  const lastGiftActionExecTime = useRef<Date>(
    new Date(Date.now() - ACTION_DELAY)
  );
  const eventCb = useRef(null);
  eventCb.current = (data, updatedFields = []) => {
    const { giftActionList } = data || {};
    if (!giftActionList) return;
    execGiftActions(giftActionList, lastGiftActionExecTime, players);
  };

  // 监听数据库变化
  useEffect(() => {
    if (!pageShow) return;
    const watcher = watchDataBase(id, cb);
    const eventsWatcher = watchEvents_DataBase(id, eventCb);
    return () => {
      watcher.close();
      eventsWatcher.close();
    };
  }, [pageShow]);

  // 游戏未结束时，一直更新在线状态和回合倒计时
  useEffect(() => {
    if (end || !pageShow) return;
    updatePlayerOnline_Database(gameData);
    const timer = setInterval(() => {
      updatePlayerOnline_Database(gameData);
    }, 2000);

    const roundTimer = setInterval(() => {
      const timeStamp = Date.now();
      const roundCountDown = Math.floor(
        ROUND_TIME_LIMIT - (timeStamp - (roundTimeStamp || timeStamp)) / 1000
      );
      const showRoundCountDown = (roundCountDown >= 0 ? roundCountDown : 0)
        .toString()
        .padStart(2, "0");
      setRoundCountDown(showRoundCountDown);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(roundTimer);
    };
  }, [end, pageShow, roundTimeStamp, gameData]);

  const canJoin = players.length <= 1;
  const noDices = chances === DICE_CHANCES_NUM;
  const allFreezing = diceList.filter((e) => e.freezing).length === DICE_NUM;
  const canDice = inRound && chances > 0 && !showDicing && !end && !allFreezing;

  // 更新游戏数据
  const init = async (data: GameBaseData) => {
    const gameData = handleGameData(data);
    const { players, diceList } = gameData;
    setGameData(gameData);
    setPlayers(players);
    diceList && setDiceList(diceList);
    setShowDicing(false);
  };

  async function DiceIt() {
    if (waiting) return;
    setWaiting(true);
    // 重置填分表
    selectScore(null, null);
    // 开始摇骰子
    setDicing(true);
    setShowDicing(true);

    const newDiceList = randomDiceList();

    // 更新掷骰子数据
    await Promise.all([
      SLEEP(500),
      updateGame(id, {
        chances: chances - 1,
        diceList: newDiceList,
      }),
    ]);
    setDicing(false);
    setWaiting(false);
  }

  function randomDiceList(): DiceData[] {
    const newDiceList = [];
    diceList.forEach((dice) => {
      const { freezing } = dice;
      if (freezing) {
        newDiceList.push(dice);
      } else {
        newDiceList.push({
          value: Math.ceil(Math.random() * 6),
        });
      }
    });

    return newDiceList;
  }

  function selectScore(type: string, score: number) {
    setNewScore({
      type,
      score,
    });
    if (type) {
      setConfirmFlag(true);
    } else {
      setConfirmFlag(false);
    }
  }

  async function updateScores() {
    const { type, score } = newScore || {};
    if (!type) return;
    if (waiting) return;
    setWaiting(true);
    const newScores = {
      ...scores,
      [type]: score,
    };

    // 重置填分表
    selectScore(null, null);
    // 更新玩家分数
    await updateGameScores(id, newScores, type);
    setWaiting(false);
  }

  function clickStartBtn() {
    if (players.length === 1) {
      setShowConfirmStartModal(true);
    } else {
      confirmStartGame();
    }
  }
  function confirmStartGame() {
    getUserProfile(() => {
      startGame(id);
    });
  }

  // 冻结骰子
  function freezeDice(index) {
    const dice = diceList[index];
    const { value, freezing } = dice;

    if (!value) return;

    diceList[index].freezing = !freezing;

    setDiceList([...diceList]);
  }

  // 踢出玩家
  function kickPlayer(openid) {
    kickFromGame(id, openid);
  }

  return (
    <View className="game">
      <LoadPage></LoadPage>
      <GameGift />
      <PlayerContext.Provider
        value={{
          gameID: id,
          players,
          playerIndex,
          kickPlayer,
          initGameIndex: AchievementGameIndex.yahtzee,
          showScore: start,
          showSetting: own && !start,
          showActive: !end,
          showOffline: !end,
          showGift: !end && inGame,
        }}
      >
        <PlayerList players={players}></PlayerList>
      </PlayerContext.Provider>
      <View className="scroll-box">
        <RatingTable
          diceList={diceList}
          selectScore={selectScore}
          newScore={newScore}
          noDices={noDices}
          players={players}
          roundPlayer={roundPlayer}
          inRound={inRound}
        ></RatingTable>
      </View>
      {gameData && start && !end && players.length > 1 && (
        <View className="at-row at-row__align--center count-down-box">
          {/* 倒计时小于一定时间再显示，避免回合切换时的突兀 */}
          {roundCountDown <= SHOW_ROUND_TIME_LIMIT && (
            <View
              className={`count-down ${roundCountDown < 10 ? "error" : ""}`}
            >
              {roundCountDown}
            </View>
          )}
        </View>
      )}
      {gameData && (
        <View className="dice-list-box">
          {end ? (
            players.length <= 1 ? null : winner === -1 ? (
              <View className="result-box">
                <Text className="text">双方平局</Text>
              </View>
            ) : (
              <View className="result-box">
                <Text className="text">获胜者</Text>
                <Player data={players[winner]}></Player>
              </View>
            )
          ) : (
            <DiceList
              diceList={diceList}
              dicing={showDicing}
              freezeDice={freezeDice}
              inRound={inRound}
            ></DiceList>
          )}
        </View>
      )}
      {gameData && (
        <View>
          {start ? (
            end ? null : (
              <View className="btn-box at-row at-row__align--center">
                <AtButton
                  type="secondary"
                  className="at-col at-col-5"
                  onClick={() => {
                    DiceIt();
                  }}
                  disabled={!canDice}
                >
                  掷骰子
                  <View className="dice-chance">{chances}</View>
                </AtButton>
                {inRound && (
                  <AtButton
                    type="primary"
                    className="at-col at-col-5"
                    disabled={!confirmFlag}
                    onClick={() => {
                      updateScores();
                    }}
                  >
                    决定
                  </AtButton>
                )}
              </View>
            )
          ) : (
            <View className="btn-box at-row at-row__align--center">
              <AtButton
                openType="share"
                type="secondary"
                className="at-col at-col-5"
              >
                邀请朋友
              </AtButton>
              {own ? (
                <AtButton
                  type="primary"
                  className="at-col at-col-5"
                  onClick={() => {
                    clickStartBtn();
                  }}
                >
                  开始
                </AtButton>
              ) : inGame ? (
                <AtButton
                  type="primary"
                  className="at-col at-col-5"
                  onClick={() => {
                    getUserProfile(() => {
                      leaveGame(id);
                    });
                  }}
                >
                  离开
                </AtButton>
              ) : (
                <AtButton
                  type="primary"
                  className="at-col at-col-5"
                  onClick={() => {
                    getUserProfile(() => {
                      joinGame(id);
                    });
                  }}
                  disabled={!canJoin}
                >
                  加入
                </AtButton>
              )}
            </View>
          )}
        </View>
      )}
      <AtModal
        isOpened={showConfirmStartModal}
        title="开始单人模式？"
        confirmText="确认"
        cancelText="取消"
        onClose={() => {
          setShowConfirmStartModal(false);
        }}
        onCancel={() => {
          setShowConfirmStartModal(false);
        }}
        onConfirm={() => {
          confirmStartGame();
          setShowConfirmStartModal(false);
        }}
      />
      {/* 悬浮按钮 */}
      <View
        className="guide-btn"
        onClick={() => {
          gotoYahtzeeGuide();
        }}
      >
        <AtFab size="small">帮助</AtFab>
      </View>
    </View>
  );
}
