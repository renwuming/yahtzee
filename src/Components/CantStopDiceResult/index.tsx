import { View, Text } from "@tarojs/components";
import { AtButton } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";
import "taro-ui/dist/style/components/flex.scss";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "../DiceIcon";
import { getRoadNum, MAX_ROAD_NUM_CANTSTOP } from "../../const";

interface IProps {
  data: CantStop.DiceData[];
  players: CantStop.CantStopPlayer[];
  roundRoad: number[];
  roundProgress: number[];
  canSelect: boolean;
  update: (list: number[]) => void;
  setCanSelectDiceNum: (num: number) => void;
}

export default function Index({
  data,
  players,
  update,
  setCanSelectDiceNum,
  canSelect,
  roundRoad,
  roundProgress,
}: IProps) {
  const realResult = calculate(data);

  const handleRealResult = realResult.map((list) => {
    const [group1, group2] = list;
    const v1 = group1.reduce((a, b) => a + b);
    const v2 = group2.reduce((a, b) => a + b);
    const selectData = calculateSelectData(v1, v2);
    const { selectStr, selectList } = selectData;

    const canClick1 = selectList.includes(v1);
    const canClick2 = selectList.includes(v2);

    return {
      group1,
      group2,
      v1,
      v2,
      selectData,
      selectStr,
      selectList,
      canClick1,
      canClick2,
    };
  });

  const canSelectDiceNum = handleRealResult.filter(
    ({ selectList }) => selectList.length > 0
  ).length;
  setCanSelectDiceNum(canSelectDiceNum);

  function calculate(list: CantStop.DiceData[]): number[][][] {
    const L = list.length;
    const result: number[][][] = [];
    for (let i = 1; i < L; i++) {
      const l1 = list.filter((_, index) => index === 0 || index === i);
      const l2 = list.filter((_, index) => index !== 0 && index !== i);
      result.push([l1, l2]);
    }
    return result;
  }

  const DiceFun = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  function calculateSelectData(
    v1: number,
    v2: number
  ): {
    selectList: number[] | null;
    selectStr: string;
    selectOne?: boolean;
  } {
    const list = [v1, v2].filter((road) => !judgeRoadReachTheTop(road));
    if (list.length <= 0) {
      return {
        selectList: [],
        selectStr: "x",
      };
    }
    let len = roundRoad.length;
    if (len >= MAX_ROAD_NUM_CANTSTOP) {
      const selectList = list.filter((value) => roundRoad.includes(value));
      return {
        selectList,
        selectStr: selectList.length > 0 ? selectList.join("+") : "x",
      };
    }

    if (!roundRoad.includes(v1)) len++;
    if (!roundRoad.includes(v2)) len++;

    if (len > MAX_ROAD_NUM_CANTSTOP) {
      const selectOne = v1 !== v2;
      return {
        selectList: list,
        selectStr: selectOne ? list.join("/") : list.join("+"),
        selectOne,
      };
    } else {
      return {
        selectList: list,
        selectStr: list.join("+"),
      };
    }
  }

  function judgeRoadReachTheTop(road: number): boolean {
    const num = getRoadNum(road);
    const progressList = players.map((item) => item.progress);
    return progressList
      .concat([roundProgress])
      .some((progress) => progress[road] >= num);
  }

  function handleUpdate(selectData, value: number) {
    const { selectList, selectOne } = selectData;
    if (selectOne) {
      update([value]);
    } else {
      update(selectList);
    }
  }

  return (
    <View className="cantstop-dice-result">
      {handleRealResult.map(
        ({
          group1,
          group2,
          v1,
          v2,
          selectData,
          selectStr,
          canClick1,
          canClick2,
        }) => {
          return (
            <View className="at-row at-row__align--center result-row">
              <View
                className={`${canSelect && canClick1 ? "can-click" : ""}`}
                onClick={() => {
                  if (!canSelect || !canClick1) return;
                  handleUpdate(selectData, v1);
                }}
              >
                {group1.map((value) => (
                  <View className="dice">{DiceFun[value]()}</View>
                ))}
              </View>
              <View className="m-r"></View>
              <View
                className={`${canSelect && canClick2 ? "can-click" : ""}`}
                onClick={() => {
                  if (!canSelect || !canClick2) return;
                  handleUpdate(selectData, v2);
                }}
              >
                {group2.map((value) => (
                  <View className="dice">{DiceFun[value]()}</View>
                ))}
              </View>
              <View className="m-r"></View>
              {canSelect && <Text className="nums-btn">{selectStr}</Text>}
            </View>
          );
        }
      )}
    </View>
  );
}
