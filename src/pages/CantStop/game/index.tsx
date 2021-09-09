import Taro, {
  getCurrentInstance,
  useDidHide,
  useDidShow,
  useShareAppMessage,
} from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { AtButton, AtModal } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import { useEffect, useRef, useState } from "react";
import "taro-ui/dist/style/components/flex.scss";
import PlayerList from "../../../Components/CantStopPlayerList";
import Player from "../../../Components/CantStopPlayer";
import { getUserProfile } from "../../../utils";
import Board from "../../../Components/CantStopBoard";
import DiceResult from "../../../Components/CantStopDiceResult";
import {
  diceIt,
  endRound,
  getGameData,
  handleGameData,
  joinGame,
  kickFromGame,
  leaveGame,
  startGame,
  updatePlayerOnline_Database,
  updateProgress,
  watchDataBase,
} from "./gameApi";
import { CantStopStage, CANTSTOP_ROUND_TIME_LIMIT } from "../../../const";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    const title = nickName
      ? `${nickName}邀请你来玩欲罢不能！`
      : "永远向上，欲罢不能！";
    return {
      title,
      path: `/pages/CantStop/game/index?id=${id}`,
      imageUrl:
        "https://cdn.renwuming.cn/static/cantstop/imgs/cantstop-share.jpg",
    };
  });

  const [waiting, setWaiting] = useState<boolean>(false);
  const [pageShow, setPageShow] = useState<boolean>(true);
  const [canSelectDiceNum, setCanSelectDiceNum] = useState<number>(0);
  const [players, setPlayers] = useState<CantStop.CantStopPlayer[]>([]);
  const [gameData, setGameData] = useState<CantStop.GameData>(null);
  const [showConfirmStartModal, setShowConfirmStartModal] =
    useState<boolean>(false);
  const [showConfirmEndModal, setShowConfirmEndModal] =
    useState<boolean>(false);
  const [roundCountDown, setRoundCountDown] = useState<number | string>(
    Infinity
  );

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
  // 更新游戏数据
  const init = async (data: CantStop.GameBaseData) => {
    const gameData = handleGameData(data);
    const { players, round } = gameData || {};
    const { roundTimeStamp } = round || {};
    setPlayers(players);
    setGameData(gameData);
    const showRoundCountDown = getShowRoundCountDown(roundTimeStamp);
    setRoundCountDown(showRoundCountDown);
  };
  const cb = useRef(null);
  cb.current = (data, updatedFields = []) => {
    if (!data) return;
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
  // 监听数据库变化
  useEffect(() => {
    if (!pageShow) return;
    const watcher = watchDataBase(id, cb);
    return () => {
      watcher.close();
    };
  }, [pageShow]);

  const { start, end, own, inGame, round, canJoin, roundSum, winner, inRound } =
    gameData || {};
  const { stage, diceList, roundProgress, roundRoad, roundTimeStamp } =
    round || {};

  const singlePlayer = players.length === 1;

  const canDice = inRound && stage === CantStopStage.Dice;
  const canSelect = stage === CantStopStage.Select;

  // 游戏未结束时，一直更新在线状态和回合倒计时
  useEffect(() => {
    if (end || !pageShow) return;
    updatePlayerOnline_Database(gameData);
    const timer = setInterval(() => {
      updatePlayerOnline_Database(gameData);
    }, 2000);

    const roundTimer = setInterval(() => {
      const showRoundCountDown = getShowRoundCountDown(roundTimeStamp);
      setRoundCountDown(showRoundCountDown);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(roundTimer);
    };
  }, [end, pageShow, gameData, roundTimeStamp]);

  function getShowRoundCountDown(roundTimeStamp) {
    const timeStamp = Date.now();
    const roundCountDown = Math.floor(
      CANTSTOP_ROUND_TIME_LIMIT -
        (timeStamp - (roundTimeStamp || timeStamp)) / 1000
    );
    return (roundCountDown >= 0 ? roundCountDown : 0)
      .toString()
      .padStart(2, "0");
  }

  async function clickDiceIt() {
    if (waiting) return;
    setWaiting(true);
    await diceIt(id);
    setWaiting(false);
  }

  async function _updateProgress(list: number[]) {
    if (waiting) return;
    setWaiting(true);
    await updateProgress(id, list);
    setWaiting(false);
  }

  async function clickEndRound() {
    if (canSelectDiceNum <= 0 && stage === CantStopStage.Select) {
      endTheRound();
    } else setShowConfirmEndModal(true);
  }
  async function endTheRound() {
    if (waiting) return;
    setWaiting(true);
    await endRound(id);
    setWaiting(false);
  }

  function clickStartBtn() {
    if (singlePlayer) {
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
  // 踢出玩家
  function kickPlayer(openid) {
    kickFromGame(id, openid);
  }
  return (
    <View className="cantstop-game">
      <View className="player-list-box">
        <PlayerList
          players={players}
          start={start}
          end={end}
          showSetting={own && !start}
          kickPlayer={kickPlayer}
          showOffline={!end}
          roundCountDown={singlePlayer ? Infinity : roundCountDown}
        ></PlayerList>
        {singlePlayer && start && !end && (
          <View className="round-sum-box">
            <Text className="text">回合数</Text>
            <Text className="number">{roundSum}</Text>
          </View>
        )}
      </View>
      <Board
        roundProgress={roundProgress}
        roundRoad={roundRoad}
        players={players}
      />
      {gameData && (
        <View className="at-row at-row__align--center game-result-row">
          {start && !end && (
            <DiceResult
              data={diceList}
              update={_updateProgress}
              roundRoad={roundRoad}
              roundProgress={roundProgress}
              players={players}
              canSelect={canSelect}
              setCanSelectDiceNum={setCanSelectDiceNum}
            />
          )}
          {start ? (
            end ? (
              <View className="end-box at-row at-row__align--center">
                {singlePlayer ? (
                  <View className="result-box">
                    <Text className="text">回合数</Text>
                    <Text className="number">{roundSum}</Text>
                  </View>
                ) : (
                  <View className="result-box">
                    <Text className="text">获胜者</Text>
                    <Player data={players[winner]}></Player>
                  </View>
                )}
              </View>
            ) : (
              <View className="btn-row">
                <AtButton
                  type="secondary"
                  className="dice-btn"
                  onClick={() => {
                    clickDiceIt();
                  }}
                  disabled={!canDice}
                >
                  掷骰子
                </AtButton>
                <AtButton
                  type="secondary"
                  className="end-btn"
                  onClick={() => {
                    clickEndRound();
                  }}
                  disabled={!inRound}
                >
                  结束回合
                </AtButton>
              </View>
            )
          ) : own ? (
            <View className="btn-box at-row at-row__align--center">
              <AtButton
                openType="share"
                type="secondary"
                className="at-col at-col-5"
              >
                邀请朋友
              </AtButton>
              <AtButton
                type="secondary"
                className="at-col at-col-5"
                onClick={() => {
                  clickStartBtn();
                }}
              >
                开始
              </AtButton>
            </View>
          ) : (
            <View className="btn-box at-row at-row__align--center">
              <AtButton
                openType="share"
                type="secondary"
                className="at-col at-col-5"
              >
                邀请朋友
              </AtButton>
              {inGame ? (
                <AtButton
                  type="secondary"
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
                  type="secondary"
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
      <AtModal
        isOpened={showConfirmEndModal}
        title="结束回合？"
        confirmText="确认"
        cancelText="取消"
        onClose={() => {
          setShowConfirmEndModal(false);
        }}
        onCancel={() => {
          setShowConfirmEndModal(false);
        }}
        onConfirm={() => {
          endTheRound();
          setShowConfirmEndModal(false);
        }}
      />
    </View>
  );
}
