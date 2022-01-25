import { View, Text } from "@tarojs/components";
import { AtButton, AtIcon, AtModal, AtModalContent } from "taro-ui";
import HallPlayer from "@/Components/HallPlayer";
import RummyCard from "@/Components/RummyCard";
import "./index.scss";
import { CARD_SUM, SeasonRankScoreMap } from "@/const";
import { useState } from "react";
import { GROUND_COL_LEN, GROUND_ROW_LEN } from "@/pages/Rummy/game/api";

interface IProps {
  data: Rummy.RummyGameData;
}

export default function Index({ data }: IProps) {
  const [isOpened, setIsOpened] = useState<boolean>(false);

  const { players, rankList, winner, playgroundData, cardLibrary } = data;

  const rankPlayers = rankList.map((rank) => players[rank]);
  const playerSum = players.length;
  const singlePlayer = playerSum === 1;
  const groundCardSum = CARD_SUM - cardLibrary.length;

  return (
    <View className="rummy-result-list">
      {singlePlayer ? (
        <View className="playground">
          {new Array(GROUND_COL_LEN).fill(1).map((_, colIndex) => {
            const show4 = colIndex <= 5 && colIndex % 3 === 0;
            const showN = colIndex > 5 && (colIndex - 8) % 3 === 0;
            const showIndex = show4 || showN;
            return (
              <View key={colIndex} className="row">
                {new Array(GROUND_ROW_LEN).fill(1).map((_, rowIndex) => {
                  let indexValue;
                  if (show4) {
                    if (rowIndex >= 2 && rowIndex <= 10 && rowIndex !== 6) {
                      indexValue = 4;
                    }
                  } else {
                    indexValue = rowIndex + 1;
                  }

                  const card = playgroundData[colIndex][rowIndex];
                  return (
                    <View key={rowIndex} className="playground-box">
                      {card ? (
                        <RummyCard data={card}></RummyCard>
                      ) : (
                        showIndex && indexValue
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      ) : (
        rankPlayers.map((player, rank) => {
          const { cardList } = player;
          const scoreChange = SeasonRankScoreMap[playerSum][rank];
          const emptyHand = cardList.length === 0;
          return (
            <View className="result-row">
              <HallPlayer data={player}></HallPlayer>
              <View className="card-box">
                {emptyHand ? (
                  <Text>出完啦 🎉</Text>
                ) : (
                  cardList.map((card) => (
                    <RummyCard data={card} offset={true}></RummyCard>
                  ))
                )}
              </View>
              <View className="score">
                {scoreChange >= 0 ? `+${scoreChange}` : scoreChange}
              </View>
            </View>
          );
        })
      )}

      {singlePlayer ? (
        <View className="bottom-box">
          <HallPlayer data={players[winner]}></HallPlayer>
          <Text className="text">用牌数</Text>
          <Text className="number">{groundCardSum}</Text>
        </View>
      ) : (
        <View className="bottom-box">
          <Text className="text">获胜者</Text>
          <HallPlayer data={players[winner]}></HallPlayer>
          <AtButton
            className="btn"
            onClick={() => {
              setIsOpened(true);
            }}
          >
            <AtIcon value="image" size="14" color="#fff"></AtIcon>
          </AtButton>
        </View>
      )}

      <AtModal
        isOpened={isOpened}
        onClose={() => {
          setIsOpened(false);
        }}
        onCancel={() => {
          setIsOpened(false);
        }}
      >
        <AtModalContent>
          <View className="playground">
            {new Array(GROUND_COL_LEN).fill(1).map((_, colIndex) => {
              const show4 = colIndex <= 5 && colIndex % 3 === 0;
              const showN = colIndex > 5 && (colIndex - 8) % 3 === 0;
              const showIndex = show4 || showN;
              return (
                <View key={colIndex} className="row">
                  {new Array(GROUND_ROW_LEN).fill(1).map((_, rowIndex) => {
                    let indexValue;
                    if (show4) {
                      if (rowIndex >= 2 && rowIndex <= 10 && rowIndex !== 6) {
                        indexValue = 4;
                      }
                    } else {
                      indexValue = rowIndex + 1;
                    }

                    const card = playgroundData[colIndex][rowIndex];
                    return (
                      <View key={rowIndex} className="playground-box">
                        {card ? (
                          <RummyCard data={card}></RummyCard>
                        ) : (
                          showIndex && indexValue
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
