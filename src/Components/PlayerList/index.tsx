import { View } from "@tarojs/components";
import "./index.scss";
import Player from "../Player";

interface IProps {
  players: Player[];
  start: boolean;
  showOffline?: boolean;
  showSetting?: boolean;
  kickPlayer?: (openid: string) => void;
}

export default function Index({
  players,
  start,
  showOffline = false,
  showSetting = false,
  kickPlayer = () => {},
}: IProps) {
  return (
    <View className="player-list">
      {players.map((player, index) => (
        <Player
          data={player}
          showScore={start}
          showActive={true}
          showOffline={showOffline}
          showSetting={index !== 0 && showSetting}
          kickPlayer={kickPlayer}
        ></Player>
      ))}
    </View>
  );
}
