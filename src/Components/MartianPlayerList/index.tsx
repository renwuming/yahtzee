import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../MartianPlayer";

interface IProps {
  players: Player[];
  start: boolean;
  end: boolean;
  showOffline?: boolean;
  showSetting?: boolean;
  kickPlayer?: (openid: string) => void;
}

export default function Index({
  players,
  start,
  end,
  showOffline = false,
  showSetting = false,
  kickPlayer = () => {},
}: IProps) {
  return (
    <View className="martian-player-list">
      {players.map((player, index) => (
        <Player
          data={player}
          showScore={start}
          showActive={!end}
          showOffline={showOffline}
          showSetting={index !== 0 && showSetting}
          kickPlayer={kickPlayer}
        ></Player>
      ))}
    </View>
  );
}
