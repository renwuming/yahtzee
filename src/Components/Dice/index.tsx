import { Component } from "react";
import { View, Text } from "@tarojs/components";
import { AtButton } from "taro-ui";

import "./index.scss";

interface IProps {
  diceData: DiceData;
  freezeDice: () => void;
}

export default function Index({ diceData, freezeDice }: IProps) {
  const { value, freezing, dicing } = diceData;

  return (
    <View className="dice">
      <View
        className={`item ${freezing ? "freezing" : ""} ${
          dicing ? "dicing" : `dice${value}`
        }`}
        onClick={freezeDice}
      ></View>
    </View>
  );
}
