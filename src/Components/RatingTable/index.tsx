import { View, Text } from "@tarojs/components";
import "taro-ui/dist/style/components/flex.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";

import {
  scoreRatings,
  getBonusScore,
  BONUS_NEED,
  BONUS_SCORE,
} from "./scoreRatings";

interface IProps {
  diceList: DiceData[];
  selectScore: (type: string, score: number) => void;
  newScore: NewScore;
  noDices: boolean;
  players: Player[];
  roundPlayer: number;
}

export default function Index({
  diceList,
  selectScore,
  newScore,
  noDices,
  players,
  roundPlayer,
}: IProps) {
  const { type } = newScore || {};
  const scoresDataList = players
    .map((item) => item.scores)
    .filter((item) => item)
    .map((scores, index) => {
      const { lastScoreType, sumScore } = players[index];
      const bonus = getBonusScore(scores);
      const hasBonus = bonus >= BONUS_NEED;
      return {
        scores,
        bonus,
        hasBonus,
        sumScore,
        lastScoreType,
      };
    });

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
            const rowDataList = scoresDataList.map((item, index) => {
              const { lastScoreType } = item;
              const _score = item.scores[name];
              const hasScore = _score !== null;
              const score = hasScore ? _score : rating(diceList);
              const active = index === roundPlayer;
              const hideScore = (noDices || !active) && !hasScore;
              return {
                active,
                score,
                hasScore,
                hideScore,
                isLastScoreType: lastScoreType === name,
              };
            });

            return (
              <View className="at-row rating-item at-col-6">
                <View className="icon-box">{iconComponent()}</View>
                <View className="at-row score-row">
                  {rowDataList.map((rowData) => {
                    const {
                      score,
                      hasScore,
                      hideScore,
                      active,
                      isLastScoreType,
                    } = rowData;
                    const selected = active && type === name;
                    return (
                      <View
                        className={`score-box ${
                          active ? "active" : "not-active"
                        } ${selected ? "selected" : ""} ${
                          hasScore ? "has-score" : ""
                        }`}
                        onClick={() => {
                          if (hasScore || noDices) return;
                          toggleSelectScore(name, score);
                        }}
                      >
                        {hideScore ? "" : score}
                        {!active && isLastScoreType && (
                          <View className="last-dot"></View>
                        )}
                      </View>
                    );
                  })}
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
            {scoresDataList.map((item) => {
              const { hasBonus, bonus } = item;
              return hasBonus ? (
                <View className="at-icon at-icon-check has-bonus"></View>
              ) : (
                <View className="bonus-progress">
                  {bonus}/{BONUS_NEED}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
