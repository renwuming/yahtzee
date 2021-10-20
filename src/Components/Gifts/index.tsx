import { View, Text } from "@tarojs/components";
import { ANIMATION_BACKUP_LIST } from "../../const";
import "./index.scss";

export const Rose = function Index() {
  return (
    <View className="gift-item">
      <Text>🌹</Text>
    </View>
  );
};

export const Bomb = function Index() {
  return (
    <View className="gift-item">
      <Text>💣</Text>
    </View>
  );
};

export const Praise = function Index() {
  return (
    <View className="gift-item">
      <Text>👍🏻</Text>
    </View>
  );
};

export const GameGift = function Index() {
  const list = ANIMATION_BACKUP_LIST;
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
