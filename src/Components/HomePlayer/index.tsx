import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import Achievement from "../../Components/Achievement";
import { useState } from "react";

interface IProps {
  data: Player;
  colorType?: string;
  showAchievement?: boolean;
}

export default function Index({
  data,
  colorType = "white",
  showAchievement = true,
}: IProps) {
  const { avatarUrl, nickName, sumScore, inRound, timeStamp, openid } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);

  function doShowAchievement() {
    showAchievement && setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  return (
    <View className={`home-player`}>
      <View
        className={`player-info`}
        onClick={() => {
          doShowAchievement();
        }}
      >
        <Image className={`avatar`} src={avatarUrl}></Image>
        <Text className={colorType}>{nickName}</Text>
      </View>
      <Achievement
        data={data}
        isOpened={isAchievementOpened}
        onClose={hideAchievement}
      ></Achievement>
    </View>
  );
}
