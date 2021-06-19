import { View, Text } from "@tarojs/components";
import { useState } from "react";
import { CallCloudFunction } from "../../utils";
import "./index.scss";

export default function Index() {
  const [achievementData, setAchievementData] = useState<AchievementData>(null);

  async function initAchievement() {
    const data = await CallCloudFunction({
      name: "getAchievement",
    });
    setAchievementData(data);
  }

  initAchievement();

  const {
    singleNum,
    maxSingleSum,
    multiNum,
    maxMultiSum,
    // multiWinSum,
    multiWinRate,
  } = achievementData || {};

  return (
    <View className="achievement-box">
      <View className="detail-row">
        <Text className="left">单人局总数</Text>
        <Text className="info">{singleNum}</Text>
      </View>
      <View className="detail-row">
        <Text className="left">单人局最高分</Text>
        <Text className="info">{maxSingleSum}</Text>
      </View>
      <View className="detail-row">
        <Text className="left">多人局总数</Text>
        <Text className="info">{multiNum}</Text>
      </View>
      <View className="detail-row">
        <Text className="left">多人局最高分</Text>
        <Text className="info">{maxMultiSum}</Text>
      </View>
      {/* <View className="detail-row">
        <Text className="left">多人局胜利</Text>
        <Text className="info">{multiWinSum}</Text>
      </View> */}
      <View className="detail-row">
        <Text className="left win-rate">多人局胜率</Text>
        <Text className="win-rate">{multiWinRate}</Text>
      </View>
    </View>
  );
}
