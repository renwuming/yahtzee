import { View } from "@tarojs/components";
import { MartianDiceMap } from "../../const";
import "./index.scss";

interface IProps {
  diceData: Martian.DiceData;
  selectDice?: (dice: Martian.DiceData) => void;
  canSelect?: boolean;
  awardList?: Martian.DiceData[];
  onlyShow?: boolean;
}

export default function Index({
  diceData,
  selectDice = () => {},
  canSelect = false,
  awardList = [],
  onlyShow = true,
}: IProps) {
  const { value } = diceData;

  // 已选过的战利品，不可再次选择
  const realCanSelect =
    canSelect &&
    (MartianDiceMap[value] === "ufo" ||
      !awardList.map((item) => item.value).includes(value));

  return (
    <View className="dice">
      <View
        className={`item dice${value} ${
          !onlyShow && (realCanSelect ? "can-select" : "disabled")
        }`}
        onClick={() => {
          if (!realCanSelect) return;
          selectDice(diceData);
        }}
      ></View>
    </View>
  );
}
