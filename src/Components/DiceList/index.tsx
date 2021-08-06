import { View } from "@tarojs/components";
import Dice from "../Dice";
import "./index.scss";

interface IProps {
  diceList: DiceData[];
  freezeDice: (index: number) => void;
  inRound: boolean;
  dicing: boolean;
}

export default function Index({
  diceList,
  freezeDice,
  inRound,
  dicing,
}: IProps) {
  return (
    <View className="dice-list">
      {diceList.map((dice, index) => (
        <Dice
          diceData={dice}
          dicing={dicing}
          freezeDice={() => {
            freezeDice(index);
          }}
          inRound={inRound}
        ></Dice>
      ))}
    </View>
  );
}
