import YahtzeeDice from "@/Components/YahtzeeDice";
import { View } from "@tarojs/components";
import { useState } from "react";
import { AtButton, AtIcon } from "taro-ui";
import "./index.scss";

export default function Index() {
  const [list, setList] = useState<number[]>([Math.random() * 6 + 1]);
  const [dicing, setDicing] = useState<boolean>(false);
  const L = list.length;

  function addDice() {
    if (list.length >= 30) return;
    const n = Math.random() * 6 + 1;
    list.push(n);
    setList(list.concat());
  }
  function removeDice() {
    if (list.length <= 1) return;
    list.splice(L - 1, 1);
    setList(list.concat());
  }
  async function redice() {
    setDicing(true);
    const newList = list.map((_) => Math.random() * 6 + 1);
    setList(newList);
    setTimeout(() => {
      setDicing(false);
    }, 1000);
  }

  return (
    <View className="dice-tool">
      <View className="btn-list">
        <AtButton
          onClick={() => {
            removeDice();
          }}
          disabled={L <= 1}
        >
          <AtIcon value="subtract"></AtIcon>
        </AtButton>
        <AtButton
          onClick={() => {
            addDice();
          }}
          disabled={L >= 30}
        >
          <AtIcon value="add"></AtIcon>
        </AtButton>
        <AtButton
          onClick={() => {
            redice();
          }}
          disabled={dicing}
        >
          <AtIcon value="reload"></AtIcon>
        </AtButton>
      </View>
      <View className="dice-list">
        {list.map((n) => (
          <YahtzeeDice
            key={null}
            diceData={{ value: n }}
            freezeDice={() => {}}
            dicing={dicing}
            inRound
          ></YahtzeeDice>
        ))}
      </View>
    </View>
  );
}
