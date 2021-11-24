import { View, Text } from "@tarojs/components";
import {} from "taro-ui";
import "./index.scss";

interface IProps {
  gameName: string;
  data: AchievementItem;
}

const dataMap = {
  yahtzee: {
    title: "快艇骰子",
    rows: ["highScore", "multiWinRate", "multiNum", "singleNum"],
  },
  martian: {
    title: "火星骰",
    rows: ["highScore", "multiWinRate", "multiNum", "singleNum"],
  },
  cantstop: {
    title: "欲罢不能",
    rows: ["minRoundSum", "multiWinRate", "multiNum", "singleNum"],
  },
};

export default function Index({ gameName, data }: IProps) {
  const { minRoundSum, highScore, multiWinRate, multiNum, singleNum } =
    data || {};

  const { title, rows } = dataMap[gameName];
  return (
    <View className="achievement-item">
      <Text className="title">{title}</Text>
      <View className="at-row detail-box">
        {rows.includes("minRoundSum") && (
          <View className="detail-item">
            <Text className="text">最少回合</Text>
            <Text className="value">{minRoundSum || "-"}</Text>
          </View>
        )}
        {rows.includes("highScore") && (
          <View className="detail-item">
            <Text className="text">最高分</Text>
            <Text className="value">{highScore || "-"}</Text>
          </View>
        )}
        {rows.includes("multiWinRate") && (
          <View className="detail-item">
            <Text className="text">胜率</Text>
            <Text className="value">{multiWinRate || "-"}</Text>
          </View>
        )}
        {rows.includes("multiNum") && (
          <View className="detail-item">
            <Text className="text">多人局</Text>
            <Text className="value">{multiNum || "-"}</Text>
          </View>
        )}
        {rows.includes("singleNum") && (
          <View className="detail-item">
            <Text className="text">单人局</Text>
            <Text className="value">{singleNum || "-"}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
