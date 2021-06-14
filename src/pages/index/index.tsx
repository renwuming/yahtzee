import { useState } from "react";
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

import DiceList from "../../Components/DiceList";
import RatingTable from "../../Components/RatingTable";
import { gameOver } from "../../Components/RatingTable/scoreRatings";

export default function Index() {
  const [diceList, setDiceList] = useState<DiceData[]>(DEFAULT_DICE_LIST);
  const [dicing, setDicing] = useState<boolean>(false);
  const [confirmFlag, setConfirmFlag] = useState<boolean>(false);
  const [newScore, setNewScore] = useState<NewScore>(null);
  const [scores, setScores] = useState<Scores>(DEFAULT_SCORES);
  const [chances, setChances] = useState<number>(DICE_CHANCES_NUM);

  const noDices = chances === DICE_CHANCES_NUM;
  const isOver = gameOver(scores);
  const canDice = chances > 0 && !dicing && !isOver;

  function DiceIt() {
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

    setTimeout(() => {
      const newDiceList = randomDiceList();
      setDiceList(newDiceList);
      setDicing(false);
      setChances((chances) => chances - 1);
    }, 1000);
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

  function updateScores() {
    const { type, score } = newScore || {};
    const newScores = {
      ...scores,
      [type]: score,
    };
    setScores(newScores);
    setConfirmFlag(false);
    setDiceList(DEFAULT_DICE_LIST);
    setChances(DICE_CHANCES_NUM);
  }

  function reset() {
    selectScore(null, null);
    updateScores();
    setScores(DEFAULT_SCORES);
  }

  return (
    <View className="game">
      <RatingTable
        diceList={diceList}
        selectScore={selectScore}
        scores={scores}
        newScore={newScore}
        noDices={noDices}
      ></RatingTable>
      <DiceList diceList={diceList} setDiceList={setDiceList}></DiceList>
      <View className="btn-box at-row at-row__align--center">
        <AtButton
          className="at-col at-col-5"
          onClick={() => {
            DiceIt();
          }}
          disabled={!canDice}
        >
          投掷({chances})
        </AtButton>
        <AtButton
          className="at-col at-col-5"
          disabled={!confirmFlag}
          onClick={() => {
            updateScores();
          }}
        >
          决定
        </AtButton>
      </View>
      <View className="btn-box at-row at-row__align--center">
        <AtButton
          className="at-col at-col-10"
          onClick={() => {
            reset();
          }}
        >
          再来一局
        </AtButton>
      </View>
    </View>
  );
}
