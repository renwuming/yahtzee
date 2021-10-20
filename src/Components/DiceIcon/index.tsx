import { View, Text, Image } from "@tarojs/components";
/* @ts-ignore */
import YahtzeeImg from "../../assets/imgs/yahtzee.png";
import "./index.scss";

export function Dice1() {
  return (
    <View className="box box1">
      <View className="dot"></View>
    </View>
  );
}

export function Dice2() {
  return (
    <View className="box box2">
      <View className="dot"></View>
      <View className="dot item2"></View>
    </View>
  );
}

export function Dice3() {
  return (
    <View className="box box3">
      <View className="dot item1"></View>
      <View className="dot item2"></View>
      <View className="dot item3"></View>
    </View>
  );
}

export function Dice4() {
  return (
    <View className="box box4">
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
    </View>
  );
}

export function Dice5() {
  return (
    <View className="box box5">
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
      <View className="column">
        <View className="dot"></View>
      </View>
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
    </View>
  );
}

export function Dice6() {
  return (
    <View className="box box6">
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
      <View>
        <View className="dot"></View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
    </View>
  );
}

export function Sum() {
  return (
    <View className="box text-box">
      <Text className="small">全选</Text>
    </View>
  );
}

export function FourOfKind() {
  return (
    <View className="box text-box">
      <Text>4X</Text>
    </View>
  );
}

export function FullHouse() {
  return (
    <View className="box text-box">
      <Text className="small">葫芦</Text>
    </View>
  );
}

export function MiniStraight() {
  return (
    <View className="box text-box">
      <Text className="small">小顺</Text>
    </View>
  );
}

export function Straight() {
  return (
    <View className="box text-box">
      <Text className="small">大顺</Text>
    </View>
  );
}

export function FiveOfKind() {
  return (
    <View className="box text-box">
      <Image src={YahtzeeImg} />
    </View>
  );
}
