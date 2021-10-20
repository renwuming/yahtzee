import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "./index.scss";

import PlayerItem from "../Player";
import { navigateTo } from "../../utils";
import { PlayerContext } from "../../const";

interface IProps {
  index: number;
  game: AnyGameData;
  type?: "history" | "hall";
}

export default function Index({ index, game, type = "hall" }: IProps) {
  const { openid } = Taro.getStorageSync("userInfo");
  const { _id, players, start } = game;
  const historyType = type === "history";

  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const singleGame = players.length === 1;
  let win = false;
  let draw = false;
  if (game["winners"] !== undefined) {
    win = !singleGame && game["winners"]?.includes(playerIndex);
  } else if (game["winner"] !== undefined) {
    win = !singleGame && game["winner"] === playerIndex;
    draw = game["winner"] < 0;
  }

  function gotoGame(gameType: string) {
    navigateTo(gameType, `game/index?id=${_id}`);
  }

  return (
    <View
      className="game-item"
      onClick={() => {
        gotoGame("Yahtzee");
      }}
    >
      <Text className="index">{index + 1}</Text>
      <View className="user-box">
        {players.map((item) => (
          <PlayerContext.Provider
            value={{
              showOffline: !historyType,
            }}
          >
            <PlayerItem data={item} showAchievement={false}></PlayerItem>
          </PlayerContext.Provider>
        ))}
      </View>
      <View className="column-right">
        {historyType ? (
          singleGame ? null : draw ? (
            <Text className="title">平局</Text>
          ) : win ? (
            <Text className="title">胜利</Text>
          ) : (
            <Text className="title fail">失败</Text>
          )
        ) : (
          start && <Text className="title">进行中</Text>
        )}
      </View>
    </View>
  );
}
