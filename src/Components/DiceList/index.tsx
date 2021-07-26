import { View } from "@tarojs/components";
import Dice from "../Dice";
import "./index.scss";

interface IProps {
  diceList: DiceData[];
  setDiceList: (diceList: DiceData[]) => void;
  inRound: boolean;
}

export default function Index({ diceList, setDiceList, inRound }: IProps) {
  function freezeDice(index) {
    const { value, freezing } = diceList[index];

    if (!value) return;

    diceList[index] = {
      value,
      freezing: !freezing,
    };
    setDiceList([...diceList]);
  }

  return (
    <View className="dice-list">
      {diceList.map((dice, index) => (
        <Dice
          diceData={dice}
          freezeDice={() => {
            freezeDice(index);
          }}
          inRound={inRound}
        ></Dice>
      ))}
    </View>
  );
}
