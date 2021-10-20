import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../CantStopPlayer";

interface IProps {
  players: CantStop.CantStopPlayer[];
}

export default function Index({ players }: IProps) {
  return (
    <View className="cantstop-player-list">
      {players.map((player, index) => {
        return <Player data={player} index={index}></Player>;
      })}
    </View>
  );
}
