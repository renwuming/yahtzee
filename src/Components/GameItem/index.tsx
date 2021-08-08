import { View, Text } from "@tarojs/components";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";

import PlayerItem from "../Player";
import { navigateTo } from "../../utils";

interface IProps {
  index: number;
  game: GameData;
}

export default function Index({ index, game }: IProps) {
  const { _id, players, start } = game;

  function gotoGame() {
    navigateTo(`game/index?id=${_id}`);
  }

  return (
    <View
      className="game-item"
      onClick={() => {
        gotoGame();
      }}
    >
      <Text className="index">{index + 1}</Text>
      <View className="user-box">
        {players.map((item) => (
          <PlayerItem
            data={item}
            showOffline
            showAchievement={false}
          ></PlayerItem>
        ))}
      </View>
      <View className="column-right">
        {start && <Text className="title">进行中</Text>}
      </View>
    </View>
  );
}
