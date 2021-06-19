import { View, Image, Text } from "@tarojs/components";
import "./index.scss";

interface IProps {
  data: Player;
  showScore: boolean;
  showActive?: boolean;
}

export default function Index({ data, showScore, showActive = true }: IProps) {
  const { avatarUrl, nickName, sumScore, inRound } = data;
  return (
    <View className={`player ${showActive && inRound ? "active" : ""}`}>
      <View className="player-info">
        <Image className={`avatar`} src={avatarUrl}></Image>
        <Text>{nickName}</Text>
      </View>
      {showScore && (
        <View className="score">
          <Text>{sumScore}</Text>
        </View>
      )}
    </View>
  );
}
