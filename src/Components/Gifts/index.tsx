import { clearGiftAnimate } from "@/utils_api";
import { View, Text } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { ANIMATION_BACKUP_LIST } from "../../const";
import "./index.scss";

export const Rose = function Index() {
  return (
    <View className="gift-item">
      <Text>πΉ</Text>
    </View>
  );
};

export const Bomb = function Index() {
  return (
    <View className="gift-item">
      <Text>π£</Text>
    </View>
  );
};

export const Praise = function Index() {
  return (
    <View className="gift-item">
      <Text>ππ»</Text>
    </View>
  );
};

export const GameGift = function Index() {
  const list = ANIMATION_BACKUP_LIST;

  useDidShow(() => {
    clearGiftAnimate();
  });

  return (
    <View id="game-gift-container">
      {list.map((_, index) => (
        <View className={`game-gift rose-${index}`}>
          <Rose></Rose>
        </View>
      ))}
      {list.map((_, index) => (
        <View className={`game-gift bomb-${index}`}>
          <Bomb></Bomb>
        </View>
      ))}
      {list.map((_, index) => (
        <View className={`game-gift praise-${index}`}>
          <Praise></Praise>
        </View>
      ))}
    </View>
  );
};

const sendGiftMsgMap = {
  rose: "δΈζ― πΉ",
  bomb: "δΈι’ π£",
  praise: "δΈδΈͺ ππ»",
};
export function getSendGiftMsg(giftType: string) {
  return sendGiftMsgMap[giftType];
}
