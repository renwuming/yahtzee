import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";

import PlayerItem from "../MartianPlayer";
import { navigateTo } from "../../utils";

interface IProps {
  index: number;
  game: Martian.GameData;
  type?: "history" | "hall";
}

export default function Index({ index, game, type = "hall" }: IProps) {
  const { openid } = Taro.getStorageSync("userInfo");
  const { _id, players, start, winners } = game;
  const historyType = type === "history";

  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const singleGame = players.length === 1;
  const win = !singleGame && winners?.includes(playerIndex);

  function gotoGame(gameType: string) {
    navigateTo(gameType, `game/index?id=${_id}`);
  }

  return (
    <View
      className="martian-game-item"
      onClick={() => {
        gotoGame("Martian");
      }}
    >
      <Text className="index">{index + 1}</Text>
      <View className="user-box">
        {players.map((item) => (
          <PlayerItem
            data={item}
            showOffline={!historyType}
            showAchievement={false}
          ></PlayerItem>
        ))}
      </View>
      <View className="column-right">
        {historyType ? (
          singleGame ? null : win ? (
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
