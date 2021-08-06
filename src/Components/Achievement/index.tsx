import { View, Text, CommonEventFunction, Image } from "@tarojs/components";
import { AtModal, AtModalHeader, AtModalContent } from "taro-ui";
import { useEffect, useState } from "react";
import { CallCloudFunction } from "../../utils";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";

interface IProps {
  data: Player;
  isOpened: boolean;
  onClose: CommonEventFunction<any>;
}

export default function Index({ data, isOpened, onClose }: IProps) {
  const [achievementData, setAchievementData] = useState<Player>(null);

  const { openid, nickName, avatarUrl } = data;

  async function initAchievement() {
    const data = await CallCloudFunction({
      name: "getPlayers",
      data: { openid },
    });
    setAchievementData(data);
  }

  useEffect(() => {
    if (isOpened) initAchievement();
  }, [isOpened]);

  const { singleNum, multiNum, multiWinSum, multiWinRate, highScore } =
    achievementData || {};

  return (
    <View className="achievement-box">
      <AtModal isOpened={isOpened} onClose={onClose}>
        <AtModalHeader>
          <View className="player-info-big">
            <Image className={`avatar`} src={avatarUrl}></Image>
            <Text>{nickName}</Text>
          </View>
        </AtModalHeader>
        <AtModalContent>
          <View className="detail-row">
            <Text className="left red">最高分</Text>
            <Text className="red">{highScore}</Text>
          </View>
          <View className="detail-row">
            <Text className="left red">多人局胜率</Text>
            <Text className="red">{multiWinRate}</Text>
          </View>
          <View className="detail-row">
            <Text className="left">多人局胜利</Text>
            <Text className="info">{multiWinSum}</Text>
          </View>
          <View className="detail-row">
            <Text className="left">多人局总数</Text>
            <Text className="info">{multiNum}</Text>
          </View>
          <View className="detail-row">
            <Text className="left">单人局总数</Text>
            <Text className="info">{singleNum}</Text>
          </View>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
