import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "taro-ui/dist/style/components/button.scss";
import "./index.scss";

import PlayerItem from "../Player";
import { navigateTo } from "../../utils";

interface IProps {
  index: number;
  game: GameData;
  type?: "history" | "hall";
}

export default function Index({ index, game, type = "hall" }: IProps) {
  const { openid } = Taro.getStorageSync("userInfo");
  const { _id, players, start, winner } = game;
  const historyType = type === "history";

  const openids = players.map((item) => item.openid);
  const singleGame = players.length === 1;
  const draw = winner < 0;
  const win = !singleGame && openids.indexOf(openid) === winner;

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
            showOffline={!historyType}
            showAchievement={false}
          ></PlayerItem>
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
