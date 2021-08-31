import { View } from "@tarojs/components";
import { MartianDice } from "../../const";
import "./index.scss";

interface IProps {
  diceData: DiceData;
  selectDice?: (dice: DiceData) => void;
  canSelect?: boolean;
  diceResultData?: DiceData[];
  onlyShow?: boolean;
}

export default function Index({
  diceData,
  selectDice = () => {},
  canSelect = false,
  diceResultData = [],
  onlyShow = true,
}: IProps) {
  const { value } = diceData;

  // 已选过的战利品，不可再次选择
  const realCanSelect =
    canSelect &&
    (value === MartianDice.ufo ||
      !diceResultData.map((item) => item.value).includes(value));

  return (
    <View className="dice">
      <View
        className={`item dice${value} ${
          !onlyShow && !realCanSelect && "disabled"
        }`}
        onClick={() => {
          if (!realCanSelect) return;
          selectDice(diceData);
        }}
      ></View>
    </View>
  );
}
