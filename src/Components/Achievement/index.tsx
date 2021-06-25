import { View, Text, CommonEventFunction } from "@tarojs/components";
import { AtModal, AtModalHeader, AtModalContent } from "taro-ui";
import { useEffect, useRef, useState } from "react";
import { CallCloudFunction } from "../../utils";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";

interface IProps {
  data: Player;
  isOpened: boolean;
  onClose: CommonEventFunction<any>;
}

export default function Index({ data, isOpened, onClose }: IProps) {
  const [achievementData, setAchievementData] = useState<AchievementData>(null);

  const { openid, nickName } = data;

  async function initAchievement() {
    const data = await CallCloudFunction({
      name: "getAchievement",
      data: { id: openid },
    });
    setAchievementData(data);
  }

  useEffect(() => {
    if (isOpened) initAchievement();
  }, [isOpened]);

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
      <AtModal isOpened={isOpened} onClose={onClose}>
        <AtModalHeader>
          <Text>{nickName}</Text>
        </AtModalHeader>
        <AtModalContent>
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
          <View className="detail-row">
            <Text className="left win-rate">多人局胜率</Text>
            <Text className="win-rate">{multiWinRate}</Text>
          </View>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
