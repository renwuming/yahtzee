import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../CommonPlayer";
import { useContext } from "react";
import { AchievementGameIndex, PlayerContext } from "@/const";
import clsx from "clsx";

interface IProps {
  players: AnyPlayer[];
}

export default function Index({ players }: IProps) {
  const playerContext = useContext(PlayerContext);
  const { initGameIndex } = playerContext;

  const isSetPlayer = initGameIndex === AchievementGameIndex.set;
  const isRummyPlayer = initGameIndex === AchievementGameIndex.rummy;

  return (
    <View
      className={clsx(
        "common-player-list",
        isSetPlayer && "set-player-list",
        isRummyPlayer && "rummy-player-list"
      )}
    >
      {players.map((player, index) => (
        <Player data={player} index={index}></Player>
      ))}
    </View>
  );
}
