import { View } from "@tarojs/components";
import clsx from "clsx";
import { useContext } from "react";
import { AchievementGameIndex, PlayerContext } from "@/const";
import Player from "../CommonPlayer";
import "./index.scss";

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
        <Player key={player.openid} data={player} index={index}></Player>
      ))}
    </View>
  );
}
