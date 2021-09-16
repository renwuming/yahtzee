import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../CantStopPlayer";

interface IProps {
  players: CantStop.CantStopPlayer[];
  start: boolean;
  end: boolean;
  showOffline?: boolean;
  showSetting?: boolean;
  kickPlayer?: (openid: string) => void;
  roundCountDown?: string | number;
}

export default function Index({
  players,
  start,
  end,
  showOffline = false,
  showSetting = false,
  kickPlayer = () => {},
  roundCountDown,
}: IProps) {
  return (
    <View className="cantstop-player-list">
      {players.map((player, index) => {
        const { inRound } = player;
        return (
          <Player
            data={player}
            showActive={!end}
            showOffline={showOffline}
            showSetting={index !== 0 && showSetting}
            index={index}
            kickPlayer={kickPlayer}
            roundCountDown={inRound ? roundCountDown : null}
            showGift={start && !end}
          ></Player>
        );
      })}
    </View>
  );
}
