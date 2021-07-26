import { View } from "@tarojs/components";
import "./index.scss";

interface IProps {
  diceData: DiceData;
  freezeDice: () => void;
  inRound: boolean;
}

export default function Index({ diceData, freezeDice, inRound }: IProps) {
  const { value, freezing, dicing } = diceData;

  return (
    <View className="dice">
      <View
        className={`item ${freezing ? "freezing" : ""} ${
          dicing ? "dicing" : `dice${value}`
        }`}
        onClick={() => {
          if (inRound) freezeDice();
        }}
      ></View>
    </View>
  );
}
