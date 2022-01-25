import { View, Image } from "@tarojs/components";
import { AtButton } from "taro-ui";
import clsx from "clsx";
// @ts-ignore
import JokerIcon from "@/assets/imgs/rummy-joker.png";
import "./index.scss";

interface IProps {
  data: Rummy.RummyCardData;
  inGround?: boolean;
  offset?: boolean;
  isErr?: boolean;
}

export default function Index({
  data,
  inGround = false,
  offset = false,
  isErr = false,
}: IProps) {
  const { value, color } = data;
  const isJoker = value === 0;
  return (
    <View
      className={clsx("rummy-card", color, offset && "offset", isErr && "err")}
    >
      {isJoker ? (
        <Image className="card-img" mode="aspectFit" src={JokerIcon}></Image>
      ) : (
        <View className="content">
          {value}
          {inGround && <View className="point"></View>}
        </View>
      )}
    </View>
  );
}
