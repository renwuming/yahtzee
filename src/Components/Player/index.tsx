import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";
import Achievement from "../../Components/Achievement";
import { useState } from "react";

interface IProps {
  data: Player;
  showScore?: boolean;
  showActive?: boolean;
}

export default function Index({
  data,
  showScore = false,
  showActive = false,
}: IProps) {
  const { avatarUrl, nickName, sumScore, inRound } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);

  function showAchievement() {
    setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  return (
    <View
      className={`player ${showActive && inRound ? "active" : ""}`}
      onClick={() => {
        showAchievement();
      }}
    >
      <View className="player-info">
        <Image className={`avatar`} src={avatarUrl}></Image>
        <Text>{nickName}</Text>
      </View>
      {showScore && (
        <View className="score">
          <Text>{sumScore}</Text>
        </View>
      )}

      <Achievement
        data={data}
        isOpened={isAchievementOpened}
        onClose={hideAchievement}
      ></Achievement>
    </View>
  );
}
