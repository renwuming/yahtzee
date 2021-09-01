import Taro, {
  getCurrentInstance,
  useDidHide,
  useDidShow,
  useShareAppMessage,
} from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { AtButton, AtModal } from "taro-ui";
// @ts-ignore
import BkImg from "../../../assets/imgs/martian-bk.jpg";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import Dice from "../../../Components/MartianDice";
import { MartianStage } from "../../../const";
import { useEffect, useRef, useState } from "react";
import {
  diceIt,
  endRound,
  getGameData,
  handleGameData,
  joinGame,
  kickFromGame,
  leaveGame,
  selectDice,
  startGame,
  updatePlayerOnline_Database,
  watchDataBase,
} from "./gameApi";
import "taro-ui/dist/style/components/flex.scss";
import PlayerList from "../../../Components/MartianPlayerList";
import Player from "../../../Components/MartianPlayer";
import { getUserProfile } from "../../../utils";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    const title = nickName
      ? `${nickName}邀请你来玩火星骰！`
      : "玩火星骰，称霸地球！";
    return {
      title,
      path: `/pages/Martian/game/index?id=${id}`,
      imageUrl: "https://cdn.renwuming.cn/static/martian/imgs/share.jpg",
    };
  });

  const [pageShow, setPageShow] = useState<boolean>(true);
  const [gameData, setGameData] = useState<Martian.GameData>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showConfirmStartModal, setShowConfirmStartModal] =
    useState<boolean>(false);
  const [showConfirmEndModal, setShowConfirmEndModal] =
    useState<boolean>(false);
  const [dicing, setDicing] = useState<boolean>(false);

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
  const init = async (data: Martian.GameBaseData) => {
    const gameData = handleGameData(data);
    const { players } = gameData;
    setPlayers(players);
    setGameData(gameData);
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

  const { round, own, start, end, inRound, inGame, winners, roundSum } =
    gameData || {};
  const {
    stage,
    diceNum,
    diceList,
    tankList,
    ufoList,
    awardList,
    ufoCanWin,
    shouldRetreat,
    canSelect,
    roundScore,
  } = round || {};

  const canDice =
    inRound &&
    stage === MartianStage.Dice &&
    diceNum > 0 &&
    ufoCanWin &&
    !shouldRetreat;
  const canEnd = inRound;
  const singlePlayer = players.length === 1;

  // 游戏未结束时，一直更新在线状态和回合倒计时
  useEffect(() => {
    if (end || !pageShow) return;
    updatePlayerOnline_Database(gameData);
    const timer = setInterval(() => {
      updatePlayerOnline_Database(gameData);
    }, 2000);

    // const roundTimer = setInterval(() => {
    //   const timeStamp = Date.now();
    //   const roundCountDown = Math.floor(
    //     ROUND_TIME_LIMIT - (timeStamp - (roundTimeStamp || timeStamp)) / 1000
    //   );
    //   const showRoundCountDown = (roundCountDown >= 0 ? roundCountDown : 0)
    //     .toString()
    //     .padStart(2, "0");
    //   setRoundCountDown(showRoundCountDown);
    // }, 500);

    return () => {
      clearInterval(timer);
      // clearInterval(roundTimer);
    };
  }, [
    end,
    pageShow,
    gameData,
    // roundTimeStamp
  ]);

  function selectTheDice({ value }) {
    if (!inRound) return;
    selectDice(id, value);
  }

  function endTheRound() {
    endRound(id);
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
  // 结束回合
  function clickEndRoundBtn() {
    if (stage === MartianStage.Dice && !canDice) {
      endTheRound();
    } else if (stage === MartianStage.Select && !canSelect) {
      endTheRound();
    } else {
      setShowConfirmEndModal(true);
    }
  }
  // 掷骰子
  async function clickDiceIt() {
    if (dicing) return;
    setDicing(true);
    await diceIt(id);
    setDicing(false);
  }
  return (
    <View className="martian-game">
      <Image className="bk-img" src={BkImg} mode="aspectFill" />
      <PlayerList
        players={players}
        start={start}
        end={end}
        showSetting={own && !start}
        kickPlayer={kickPlayer}
        showOffline={!end}
      ></PlayerList>
      {end ? (
        <View className="dice-list-box no-padding at-row at-row__align--center">
          {singlePlayer ? (
            <View className="result-box">
              <Text className="text">回合数</Text>
              <Text className="number">{roundSum}</Text>
            </View>
          ) : (
            <View className="result-box">
              <Text className="text">获胜者</Text>
              {winners.map((index) => {
                const data = players[index];
                return <Player data={data}></Player>;
              })}
            </View>
          )}
        </View>
      ) : (
        <View className="dice-list-box at-row at-row__align--center">
          <View className="dice-list at-col at-col-3">
            {diceList?.map((data) => {
              return (
                <Dice
                  diceData={data}
                  selectDice={selectTheDice}
                  canSelect={canSelect}
                  awardList={awardList}
                  onlyShow={false}
                />
              );
            })}
          </View>
          <View className="dice-list at-col at-col-3">
            {tankList?.map((data) => {
              return <Dice diceData={data} />;
            })}
          </View>
          <View className="dice-list at-col at-col-3">
            {ufoList?.map((data) => {
              return <Dice diceData={data} />;
            })}
          </View>
          <View className="dice-list at-col at-col-3">
            {awardList?.map((data) => {
              return <Dice diceData={data} />;
            })}
          </View>
        </View>
      )}
      {gameData &&
        (start ? (
          end ? null : (
            <View className="btn-box at-row at-row__align--center">
              <AtButton
                type="secondary"
                className="at-col at-col-5"
                onClick={() => {
                  clickDiceIt();
                }}
                disabled={!canDice}
              >
                掷骰子
                <View className="dice-num">{diceNum}</View>
              </AtButton>
              <AtButton
                type="secondary"
                className="at-col at-col-5"
                onClick={() => {
                  clickEndRoundBtn();
                }}
                disabled={!canEnd}
              >
                结束回合
                <View className="round-score">+{roundScore}</View>
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
              >
                加入
              </AtButton>
            )}
          </View>
        ))}
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