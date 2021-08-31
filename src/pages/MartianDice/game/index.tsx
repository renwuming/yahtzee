import Taro, { useShareAppMessage } from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { AtButton } from "taro-ui";
// @ts-ignore
import BkImg from "../../../assets/imgs/martian-bk.jpg";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import Dice from "../../../Components/MartianDice";
import {
  MartianDice,
  MartianStage,
  MARTIAN_DEFAULT_DICE_LIST,
  MARTIAN_DICE_NUM,
  sortMartianDiceList,
} from "../../../const";
import { useEffect, useState } from "react";
import { calculateScore, getDiceList, handleDiceResultList } from "./gameApi";
import "taro-ui/dist/style/components/flex.scss";
import PlayerList from "../../../Components/PlayerList";

export default function Index() {
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    const title = nickName
      ? `${nickName}邀请你来玩火星骰！`
      : "玩火星骰，称霸地球！";
    return {
      title,
      path: `/pages/MartianDice/game/index`,
      // imageUrl: "https://cdn.renwuming.cn/static/yahtzee/imgs/share.png",
    };
  });

  const [diceList, setDiceList] = useState<DiceData[]>(
    MARTIAN_DEFAULT_DICE_LIST
  );
  const [diceResultList, setDiceResultList] = useState<DiceData[]>(
    MARTIAN_DEFAULT_DICE_LIST
  );
  const [diceNum, setDiceNum] = useState<number>(MARTIAN_DICE_NUM);
  const [stage, setStage] = useState<number>(MartianStage.Dice);

  function diceIt() {
    const newDiceList = getDiceList(diceNum);
    const realNewDiceList = newDiceList.filter(
      ({ value }) => value !== MartianDice.tank
    );
    const newDiceResultList = newDiceList.filter(
      ({ value }) => value === MartianDice.tank
    );
    setDiceList(realNewDiceList);
    setDiceNum(realNewDiceList.length);
    updateDiceResultList(newDiceResultList);
    setStage(MartianStage.Select);
  }

  function selectDice({ value }) {
    const newDiceList = diceList.filter((item) => item.value !== value);
    const newDiceResultList = diceList.filter((item) => item.value === value);
    setDiceList(newDiceList);
    updateDiceResultList(newDiceResultList);
    setDiceNum(newDiceList.length);
    setStage(MartianStage.Dice);
  }

  function updateDiceResultList(list) {
    const newDiceResultList = diceResultList
      .concat(list)
      .sort(sortMartianDiceList);
    setDiceResultList(newDiceResultList);
  }

  const { tankList, ufoList, otherList, needUfoNum, shouldRetreat } =
    handleDiceResultList(diceResultList);
  const ufoCanWin = diceList.length >= needUfoNum;

  const canDice =
    stage === MartianStage.Dice && diceNum > 0 && ufoCanWin && !shouldRetreat;
  const canSelect = stage === MartianStage.Select;

  // TODO
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    const userInfo = Taro.getStorageSync("userInfo");
    userInfo.sumScore = 0;
    setPlayers([userInfo]);
  }, []);

  function endRound() {
    const score = calculateScore(tankList, ufoList, otherList);
    players[0].sumScore += score;
    setPlayers([...players]);

    setDiceList(MARTIAN_DEFAULT_DICE_LIST);
    setDiceResultList(MARTIAN_DEFAULT_DICE_LIST);
    setDiceNum(MARTIAN_DICE_NUM);
    setStage(MartianStage.Dice);
  }
  return (
    <View className="martian-game">
      <Image className="bk-img" src={BkImg} mode="aspectFill" />
      <PlayerList players={players} start={true}></PlayerList>
      <View className="dice-list-box at-row at-row__align--center">
        <View className="dice-list at-col at-col-3">
          {diceList.map((data) => {
            return (
              <Dice
                diceData={data}
                selectDice={selectDice}
                canSelect={canSelect}
                diceResultData={diceResultList}
                onlyShow={false}
              />
            );
          })}
        </View>
        <View className="dice-list at-col at-col-3">
          {tankList.map((data) => {
            return <Dice diceData={data} />;
          })}
        </View>
        <View className="dice-list at-col at-col-3">
          {ufoList.map((data) => {
            return <Dice diceData={data} />;
          })}
        </View>
        <View className="dice-list at-col at-col-3">
          {otherList.map((data) => {
            return <Dice diceData={data} />;
          })}
        </View>
      </View>

      <View className="btn-box at-row at-row__align--center">
        <AtButton
          type="secondary"
          className="at-col at-col-5"
          onClick={() => {
            diceIt();
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
            endRound();
          }}
        >
          结束回合
        </AtButton>
      </View>
    </View>
  );
}
