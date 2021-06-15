import { View, Image } from "@tarojs/components";
import "./index.scss";
import Player from "../Player";

interface IProps {
  players: Player[];
}

export default function Index({ players }: IProps) {
  return (
    <View className="player-list">
      {players?.map((player) => (
        <Player data={player}></Player>
      ))}
    </View>
  );
}
