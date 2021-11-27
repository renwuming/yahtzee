import { View, Text, Image } from "@tarojs/components";
import {} from "taro-ui";
import { Bomb, Rose, Praise } from "@/Components/Gifts";
import "./index.scss";
import { getMost } from "./api";
import { useEffect, useState } from "react";
import PlayerItem from "@/Components/HallPlayer";

interface IProps {
  giftName: string;
  data: Gift;
}

const dataMap = {
  rose: {
    icon: Rose,
  },
  bomb: {
    icon: Bomb,
  },
  praise: {
    icon: Praise,
  },
};

export default function Index({ giftName, data }: IProps) {
  const { receive, receiveFrom, send, sendTo } = data || {};

  const { icon } = dataMap[giftName];

  const [receiveFromMost, setReceiveFromMost] = useState<Player>(null);
  const [sendToMost, setSendToMost] = useState<Player>(null);

  useEffect(() => {
    receiveFrom?.[giftName] &&
      getMost(receiveFrom[giftName]).then((player) => {
        setReceiveFromMost(player);
      });
    sendTo?.[giftName] &&
      getMost(sendTo[giftName]).then((player) => {
        setSendToMost(player);
      });
  }, [receiveFrom, sendTo]);
  return (
    <View className="gift-achievement-item">
      <View className="title">{icon()}</View>
      <View className="at-row detail-box">
        <View className="detail-item">
          <Text className="text">收到</Text>
          <Text className="value">{receive?.[giftName] || 0}</Text>
        </View>
        <View className="detail-item">
          <Text className="text">送出</Text>
          <Text className="value">{send?.[giftName] || 0}</Text>
        </View>
        <View className="detail-item">
          <Text className="text">金主</Text>
          {receiveFromMost ? (
            <PlayerItem noNickName={true} data={receiveFromMost}></PlayerItem>
          ) : (
            <Text className="value">-</Text>
          )}
        </View>
        <View className="detail-item">
          <Text className="text">偶像</Text>
          {sendToMost ? (
            <PlayerItem noNickName={true} data={sendToMost}></PlayerItem>
          ) : (
            <Text className="value">-</Text>
          )}
        </View>
      </View>
    </View>
  );
}
