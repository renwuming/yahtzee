import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../Player";

interface IProps {
  players: Player[];
  start: boolean;
  showOffline?: boolean;
}

export default function Index({ players, start, showOffline = false }: IProps) {
  return (
    <View className="player-list">
      {players.map((player) => (
        <Player
          data={player}
          showScore={start}
          showActive={true}
          showOffline={showOffline}
        ></Player>
      ))}
    </View>
  );
}
