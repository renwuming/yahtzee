import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import Achievement from "../Achievement";
import { useContext, useState } from "react";
import { AtActionSheet, AtActionSheetItem, AtIcon } from "taro-ui";
import { OFFLINE_DELAY, PlayerContext } from "../../const";

interface IProps {
  data: Player;
  index?: number;
  colorType?: string;
}

export default function Index({
  data,
  index = -1,
  colorType = "white",
}: IProps) {
  const playerContext = useContext(PlayerContext);
  const { showScore, showSetting, showOffline, showActive, kickPlayer } =
    playerContext;

  const realShowSetting = index !== 0 && showSetting;
  const { avatarUrl, nickName, sumScore, inRound, timeStamp, openid } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);
  const [isActionSheetOpened, setActionSheetOpened] = useState<boolean>(false);

  const offline = showOffline && Date.now() - (timeStamp || 0) > OFFLINE_DELAY;

  function doShowAchievement() {
    setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  return (
    <View className={`player ${showActive && inRound ? "active" : ""}`}>
      <View
        className={`player-info ${offline ? "offline" : ""}`}
        onClick={() => {
          doShowAchievement();
        }}
      >
        <Image
          className={`avatar`}
          id={`player-${index}-avatar`}
          src={avatarUrl}
        ></Image>
        <Text className={colorType}>{nickName}</Text>
      </View>
      {showScore && (
        <View className="score">
          <Text>{sumScore}</Text>
        </View>
      )}
      {realShowSetting && (
        <AtIcon
          className="setting"
          value="settings"
          size="18"
          color="#176999"
          onClick={() => {
            setActionSheetOpened(true);
          }}
        ></AtIcon>
      )}
      <Achievement
        data={data}
        index={index}
        isOpened={isAchievementOpened}
        onClose={hideAchievement}
      ></Achievement>
      <AtActionSheet
        isOpened={isActionSheetOpened}
        cancelText="取消"
        onCancel={() => {
          setActionSheetOpened(false);
        }}
        onClose={() => {
          setActionSheetOpened(false);
        }}
      >
        <AtActionSheetItem
          onClick={() => {
            kickPlayer(openid);
            setActionSheetOpened(false);
          }}
        >
          踢出
        </AtActionSheetItem>
      </AtActionSheet>
    </View>
  );
}
