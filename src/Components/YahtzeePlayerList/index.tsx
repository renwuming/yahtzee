import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../YahtzeePlayer";

interface IProps {
  players: Yahtzee.YahtzeePlayer[];
}

export default function Index({ players }: IProps) {
  return (
    <View className="player-list">
      {players.map((player, index) => (
        <Player data={player} index={index}></Player>
      ))}
    </View>
  );
}
