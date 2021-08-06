import { View } from "@tarojs/components";
import "./index.scss";

interface IProps {
  diceData: DiceData;
  freezeDice: () => void;
  inRound: boolean;
  dicing: boolean;
}

export default function Index({
  diceData,
  freezeDice,
  inRound,
  dicing,
}: IProps) {
  const { value, freezing } = diceData;

  return (
    <View className="dice">
      <View
        className={`item ${freezing ? "freezing" : ""} ${
          dicing && !freezing ? "dicing" : `dice${value}`
        }`}
        onClick={() => {
          if (inRound && !dicing) freezeDice();
        }}
      ></View>
    </View>
  );
}
