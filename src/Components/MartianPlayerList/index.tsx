import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../MartianPlayer";
import { useContext } from "react";
import { AchievementGameIndex, PlayerContext } from "@/const";

interface IProps {
  players: AnyPlayer[];
}

export default function Index({ players }: IProps) {
  const playerContext = useContext(PlayerContext);
  const { initGameIndex } = playerContext;

  const isSetPlayer = initGameIndex === AchievementGameIndex.set;

  return (
    <View
      className={`martian-player-list ${isSetPlayer ? "set-player-list" : ""}`}
    >
      {players.map((player, index) => (
        <Player data={player} index={index}></Player>
      ))}
    </View>
  );
}
