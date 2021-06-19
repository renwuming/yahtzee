import { useEffect, useState } from "react";
import { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/flex.scss";
import "./index.scss";
import {
  DEFAULT_DICE_LIST,
  DEFAULT_SCORES,
  DICE_CHANCES_NUM,
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
} from "./gameApi";

export default function Index() {
  // 页面参数
  const { id } = getCurrentInstance().router.params;
  // 设置分享
  useShareAppMessage(() => {
    return {
      title: "快艇骰子，一决高下！",
      path: `/pages/game/index?id=${id}`,
      imageUrl: "http://cdn.renwuming.cn/static/yahtzee/imgs/share.png",
    };
  });
  // 更新游戏数据
  async function init(data: GameBaseData) {
    const gameData = handleGameData(data);
    const { roundScores, start, diceList } = gameData;
    setGameData(gameData);
    setScores(roundScores);
    if (start) {
      setDiceList(diceList);
    }
  }
  // 监听数据库变动
  useEffect(() => {
    getGameData(id).then((data) => {
      init(data);
    });
    const watcher = watchDataBase(id, (data) => {
      init(data);
    });
    return () => {
      watcher.close();
    };
  }, []);

  const [gameData, setGameData] = useState<GameData>(null);

  const {
    start,
    own,
    inGame,
    players,
    inRound,
    chances,
    roundPlayer,
    end,
    winner,
  } = gameData || {
    players: [],
    otherScores: DEFAULT_SCORES,
  };

  const [diceList, setDiceList] = useState<DiceData[]>(DEFAULT_DICE_LIST);
  const [dicing, setDicing] = useState<boolean>(false);
  const [confirmFlag, setConfirmFlag] = useState<boolean>(false);
  const [newScore, setNewScore] = useState<NewScore>(null);
  const [scores, setScores] = useState<Scores>(DEFAULT_SCORES);

  const canJoin = players.length <= 1;
  const noDices = chances === DICE_CHANCES_NUM;
  const canDice = inRound && chances > 0 && !dicing && !end;

  async function DiceIt() {
    // 重置填分表
    selectScore(null, null);
    // 开始摇骰子
    setDicing(true);
    const newDiceList = [];
    diceList.forEach((dice) => {
      const { freezing } = dice;
      if (freezing) {
        newDiceList.push(dice);
      } else {
        newDiceList.push({
          ...dice,
          dicing: true,
        });
      }
    });
    setDiceList(newDiceList);

    const finalDiceList = randomDiceList();

    // 更新掷骰子数据
    await Promise.all([
      SLEEP(300),
      updateGame(id, {
        chances: chances - 1,
        diceList: finalDiceList,
      }),
    ]);
    setDicing(false);
  }

  function randomDiceList(): DiceData[] {
    const newDiceList = [];
    diceList.forEach((dice) => {
      const { freezing } = dice;
      // 停止摇骰子
      dice.dicing = false;
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
    const newScores = {
      ...scores,
      [type]: score,
    };

    // 重置填分表
    selectScore(null, null);
    setConfirmFlag(false);
    setDiceList(DEFAULT_DICE_LIST);
    // 更新玩家分数
    await updateGameScores(id, newScores, type);
  }

  return (
    <View className="game">
      <LoadPage></LoadPage>
      <PlayerList players={players} start={start}></PlayerList>
      <View className="scroll-box">
        <RatingTable
          diceList={diceList}
          selectScore={selectScore}
          newScore={newScore}
          noDices={noDices}
          players={players}
          roundPlayer={roundPlayer}
        ></RatingTable>
      </View>
      {gameData && (
        <View className="dice-list-box">
          {end ? (
            players.length <= 1 ? null : winner === -1 ? (
              <View className="result-box">双方平局</View>
            ) : (
              <View className="result-box">
                获胜者
                <Player
                  data={players[winner]}
                  showScore={false}
                  showActive={false}
                ></Player>
              </View>
            )
          ) : (
            <DiceList diceList={diceList} setDiceList={setDiceList}></DiceList>
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
                    getUserProfile(() => {
                      startGame(id);
                    });
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
    </View>
  );
}
