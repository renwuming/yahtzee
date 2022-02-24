import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { AtButton, AtIcon, AtModal, AtModalContent } from "taro-ui";
import HallPlayer from "@/Components/HallPlayer";
import RummyCard from "@/Components/RummyCard";
import { CARD_SUM } from "@/const";
import { useEffect, useState } from "react";
import { GROUND_COL_LEN, GROUND_ROW_LEN } from "@/pages/Rummy/game/api";
import { getSeasonRankScoreConfig } from "@/utils";
// @ts-ignore
import FreezingIcon from "@/assets/imgs/freezing.png";
// @ts-ignore
import DetailIcon from "@/assets/imgs/detail.png";
import "./index.scss";
import Ad from "../Ad";
import { showAdForScore } from "./api";

interface IProps {
  data: Rummy.RummyGameData;
}

export default function Index({ data }: IProps) {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [showAdFlag, setShowAdFlag] = useState<boolean>(false);
  const [hideAdBtn, setHideAdBtn] = useState<boolean>(false);
  const [seasonRankScoreMap, setSeasonRankScoreMap] = useState(null);

  const {
    _id,
    players,
    rankList,
    winner,
    playgroundData,
    cardLibrary,
    playerIndex,
    endTime,
    adScorePlayerList,
  } = data;

  const rankPlayers = rankList.map((index) => ({
    ...players[index],
    index,
  }));
  const playerSum = players.length;
  const singlePlayer = playerSum === 1;
  const groundCardSum = CARD_SUM - cardLibrary.length;

  // 是否展示广告逻辑
  const hasAdScore = adScorePlayerList?.includes(playerIndex);
  const myScoreChange =
    playerIndex >= 0 && seasonRankScoreMap
      ? seasonRankScoreMap[playerSum][rankList.indexOf(playerIndex)]
      : 0;
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const showAds =
    Date.now() - +new Date(endTime) < THIRTY_MINUTES &&
    myScoreChange < 0 &&
    !hasAdScore;
  function selectIfShowAd() {
    Taro.showModal({
      title: "看一段广告，免去扣分",
      success: function (res) {
        if (res.confirm) {
          setShowAdFlag(!showAdFlag);
        }
      },
    });
  }
  useEffect(() => {
    if (showAds) {
      setTimeout(() => {
        selectIfShowAd();
      }, 3000);
    }
  }, [showAds]);

  useEffect(() => {
    getSeasonRankScoreConfig().then((scoreConfig) => {
      setSeasonRankScoreMap(scoreConfig);
    });
  }, []);

  return (
    <View className="rummy-result-list">
      <Ad
        showAdFlag={showAdFlag}
        afterAd={() => {
          setHideAdBtn(true);
          showAdForScore(_id);
        }}
      />
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
          const { cardList, openid, icebreaking, index } = player;
          const scoreChange = seasonRankScoreMap?.[playerSum]?.[rank];
          const emptyHand = cardList.length === 0;
          const isMe = index === playerIndex;
          const hasAdScore = adScorePlayerList?.includes(index);
          return (
            <View key={openid} className="result-row">
              {!icebreaking && (
                <Image
                  className="freezing-icon"
                  mode="aspectFit"
                  src={FreezingIcon}
                ></Image>
              )}
              <HallPlayer data={player}></HallPlayer>
              <View className="card-box">
                {emptyHand ? (
                  <Text>出完啦 🎉</Text>
                ) : (
                  cardList.map((card) => (
                    <RummyCard key={card.id} data={card} offset></RummyCard>
                  ))
                )}
              </View>
              <View className="score">
                {scoreChange && (
                  <Text>
                    {scoreChange >= 0
                      ? `+${scoreChange}`
                      : hasAdScore || (isMe && hideAdBtn)
                      ? "-0"
                      : scoreChange}
                  </Text>
                )}
                {!hideAdBtn && isMe && showAds && (
                  <AtButton
                    className="btn"
                    onClick={() => {
                      selectIfShowAd();
                    }}
                    disabled={hideAdBtn}
                  >
                    <AtIcon value="video" size="18" color="#fff"></AtIcon>
                  </AtButton>
                )}
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
            <Image mode="aspectFit" src={DetailIcon}></Image>
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
