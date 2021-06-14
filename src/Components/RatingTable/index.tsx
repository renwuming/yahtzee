import { View, Text } from "@tarojs/components";
import "taro-ui/dist/style/components/flex.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";

import {
  scoreRatings,
  getBonusScore,
  BONUS_NEED,
  BONUS_SCORE,
  getSumScore,
} from "./scoreRatings";

interface IProps {
  diceList: DiceData[];
  selectScore: (type: string, score: number) => void;
  scores: Scores;
  newScore: NewScore;
  noDices: boolean;
}

export default function Index({
  diceList,
  selectScore,
  scores,
  newScore,
  noDices,
}: IProps) {
  const { type } = newScore || {};

  const bonus = getBonusScore(scores);
  const hasBonus = bonus >= BONUS_NEED;
  const sumScore = getSumScore(scores);

  function toggleSelectScore(newType: string, score: number) {
    if (newType === type) {
      selectScore(null, null);
    } else {
      selectScore(newType, score);
    }
  }

  return (
    <View className="rating-table">
      {scoreRatings.map((scoreRows) => (
        <View className="at-row rating-row">
          {scoreRows.map((scoreRating) => {
            const { name, iconComponent, rating } = scoreRating;
            const _score = scores[name];
            const hasScore = _score !== null;
            const score = hasScore ? _score : rating(diceList);
            const hideScore = noDices && !hasScore;
            return (
              <View className="at-row rating-item at-col-6">
                <View className="icon-box">{iconComponent()}</View>
                <View className="at-row score-row">
                  <View
                    className={`score-box active ${
                      type === name ? "selected" : ""
                    } ${hasScore ? "has-score" : ""}`}
                    onClick={() => {
                      if (hasScore || noDices) return;

                      toggleSelectScore(name, score);
                    }}
                  >
                    {hideScore ? "" : score}
                  </View>
                  {/* <View className="score-box">
                  {scoreRating.rating(diceList)}
                </View> */}
                </View>
              </View>
            );
          })}
        </View>
      ))}
      {/* 小分奖励 */}
      <View className="at-row rating-row">
        <View className="at-row rating-item at-col-6">
          <View className="icon-box bonus-box">
            <Text className="title">奖励</Text>
            <Text className="detail">+{BONUS_SCORE}</Text>
          </View>
          <View className="at-row score-row">
            {hasBonus ? (
              <View className="at-icon at-icon-check has-bonus"></View>
            ) : (
              <View className="bonus-progress">
                {bonus}/{BONUS_NEED}
              </View>
            )}
          </View>
        </View>
        <View className="at-row rating-item at-col-6">
          <View className="icon-box sum-box">
            <Text className="title">总分</Text>
            <Text className="detail">{sumScore}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
