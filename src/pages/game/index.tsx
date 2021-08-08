import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import {
  getCurrentInstance,
  useDidHide,
  useDidShow,
  useShareAppMessage,
} from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtButton, AtModal } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/flex.scss";
import "taro-ui/dist/style/components/modal.scss";

import "./index.scss";
import {
  DEFAULT_DICE_LIST,
  DEFAULT_SCORES,
  DICE_CHANCES_NUM,
  DICE_NUM,
  ROUND_TIME_LIMIT,
  SHOW_ROUND_TIME_LIMIT,
} from "../../const";
import PlayerList from "../../Components/PlayerList";
import DiceList from "../../Components/DiceList";
import RatingTable from "../../Components/RatingTable";
import Player from "../../Components/Player";
import LoadPage from "../../Components/LoadPage";

import { getUserProfile, SLEEP, watchDataBase } from "../../utils";
import {
  getGameData,
  handleGameData,
  joinGame,
  leaveGame,
  startGame,
  updateGame,
  updateGameScores,
  updatePlayerOnline,
} from "./gameApi";

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
      path: `/pages/game/index?id=${id}`,
      imageUrl: "http://cdn.renwuming.cn/static/yahtzee/imgs/share.png",
    };
  });

  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    refresh && setTimeout(() => setRefresh(false));
  }, [refresh]);
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
  } = gameData || {
    otherScores: DEFAULT_SCORES,
  };

  useDidHide(() => {
    setPageShow(false);
  });
  useDidShow(() => {
    setPageShow(true);
  });

  // 监听数据库变化
  useEffect(() => {
    if (dicing || !pageShow) return;

    const cb = (data, updatedFields = []) => {
      const gameDataInit = updatedFields.length === 0;
      const gameDataChange =
        updatedFields.filter(
          (key) => !(key === "_updateTime" || /^players\.\d/.test(key))
        ).length > 0;
      if (gameDataInit || gameDataChange) {
        init(data);
      } else {
        const gameData = handleGameData(data);
        const { players } = gameData;
        setPlayers(players);
      }
    };
    getGameData(id).then(cb);
    const watcher = watchDataBase(id, cb);

    return () => {
      watcher.close();
    };
  }, [dicing, pageShow]);

  // 游戏未结束时，一直更新在线状态和回合倒计时
  useEffect(() => {
    if (end || !pageShow) return;
    updatePlayerOnline(id);
    const timer = setInterval(() => {
      updatePlayerOnline(id);
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
  }, [end, pageShow, roundTimeStamp]);

  const canJoin = players.length <= 1;
  const noDices = chances === DICE_CHANCES_NUM;
  const allFreezing = diceList.filter((e) => e.freezing).length === DICE_NUM;
  const canDice = inRound && chances > 0 && !dicing && !end && !allFreezing;

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
    const newScores = {
      ...scores,
      [type]: score,
    };

    // 重置填分表
    selectScore(null, null);
    // 更新玩家分数
    await updateGameScores(id, newScores, type);
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

  return (
    <View className="game">
      <LoadPage></LoadPage>
      <PlayerList
        players={players}
        start={start}
        showOffline={!end}
      ></PlayerList>
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
              <View className="result-box">双方平局</View>
            ) : (
              <View className="result-box">
                获胜者
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
                  取消
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
                  准备
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
    </View>
  );
}
