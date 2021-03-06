import { getSeasonRankDataByOpenid } from "@/utils";
import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import {} from "taro-ui";
import "./index.scss";

interface IProps {
  openid: string;
  gameName: string;
  data: AchievementItem;
  noTitle?: boolean;
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
  set: {
    title: "神奇形色牌",
    rows: ["bestTime", "multiWinRate", "multiNum", "singleNum"],
  },
  rummy: {
    title: "拉密牌",
    rows: ["seasonData", "minGroundCardSum", "multiWinRate", "multiNum"],
  },
};

export default function Index({
  openid,
  gameName,
  data,
  noTitle = false,
}: IProps) {
  const {
    bestTime,
    minRoundSum,
    minGroundCardSum,
    highScore,
    multiWinRate,
    multiNum,
    singleNum,
  } = data || {};

  const { title, rows } = dataMap[gameName];

  const [rummySeasonData, setRummySeasonData] = useState<{
    name: string;
    score: number;
  }>(null);

  useEffect(() => {
    getSeasonRankDataByOpenid("rummy", openid).then((data) => {
      setRummySeasonData(data);
    });
  }, [openid]);
  return (
    <View className="achievement-item">
      {noTitle ? null : <Text className="title">{title}</Text>}
      <View className="at-row detail-box">
        {rows.includes("seasonData") && (
          <View className="detail-item">
            <Text className="text">赛季积分</Text>
            <Text className="value">{rummySeasonData?.score ?? "-"}</Text>
          </View>
        )}
        {rows.includes("bestTime") && (
          <View className="detail-item">
            <Text className="text">最短时间</Text>
            <Text className="value">
              {bestTime ? `${bestTime.toFixed(1)}s` : "-"}
            </Text>
          </View>
        )}
        {rows.includes("minRoundSum") && (
          <View className="detail-item">
            <Text className="text">最少回合</Text>
            <Text className="value">{minRoundSum || "-"}</Text>
          </View>
        )}
        {rows.includes("minGroundCardSum") && (
          <View className="detail-item">
            <Text className="text">最少用牌</Text>
            <Text className="value">{minGroundCardSum || "-"}</Text>
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
