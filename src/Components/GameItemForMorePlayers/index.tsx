import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "./index.scss";

import PlayerItem from "../MartianPlayer";
import { navigateTo } from "../../utils";
import { PlayerContext } from "../../const";

interface IProps {
  index: number;
  game: any;
  gameType: string;
  type?: "history" | "hall";
}

export default function Index({
  index,
  game,
  gameType,
  type = "hall",
}: IProps) {
  const { openid } = Taro.getStorageSync("userInfo");
  const { _id, players, start } = game;
  const historyType = type === "history";

  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const singleGame = players.length === 1;
  let win = false;
  let timeout = false;
  if (game["winners"] !== undefined) {
    win = !singleGame && game["winners"]?.includes(playerIndex);
    timeout = game["winners"].length === 0;
  } else if (game["winner"] !== undefined) {
    win = !singleGame && game["winner"] === playerIndex;
    timeout = game["winner"] < 0;
  }

  function gotoGame() {
    navigateTo(gameType, `game/index?id=${_id}`);
  }

  return (
    <View
      className="martian-game-item"
      onClick={() => {
        gotoGame();
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
          singleGame ? null : timeout ? (
            <Text className="title">超时</Text>
          ) : win ? (
            <Text className="title win">胜利</Text>
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
