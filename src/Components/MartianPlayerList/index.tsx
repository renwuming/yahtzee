import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../MartianPlayer";

interface IProps {
  players: Player[];
}

export default function Index({ players }: IProps) {
  return (
    <View className="martian-player-list">
      {players.map((player, index) => (
        <Player data={player} index={index}></Player>
      ))}
    </View>
  );
}
