import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../Player";

interface IProps {
  players: Player[];
  start: boolean;
}

export default function Index({ players, start }: IProps) {
  return (
    <View className="player-list">
      {players.map((player) => (
        <Player data={player} showScore={start}></Player>
      ))}
    </View>
  );
}
