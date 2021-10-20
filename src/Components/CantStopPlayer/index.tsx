import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import Achievement from "../../Components/Achievement";
import { useContext, useState } from "react";
import { AtActionSheet, AtActionSheetItem, AtIcon } from "taro-ui";
import { MARTIAN_SHOW_ROUND_TIME_LIMIT, PlayerContext } from "../../const";

interface IProps {
  data: CantStop.CantStopPlayer;
  index?: number;
  colorType?: string;
  showAchievement?: boolean;
}

export default function Index({
  data,
  index = -1,
  colorType = "white",
  showAchievement = true,
}: IProps) {
  const playerContext = useContext(PlayerContext);
  const { showSetting, showOffline, showActive, roundCountDown, kickPlayer } =
    playerContext;

  const realShowSetting = index !== 0 && showSetting;
  const { avatarUrl, nickName, inRound, timeStamp, openid } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);
  const [isActionSheetOpened, setActionSheetOpened] = useState<boolean>(false);

  const offline = showOffline && Date.now() - (timeStamp || 0) > 5000;

  function doShowAchievement() {
    showAchievement && setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  return (
    <View className={`cantstop-player player-${index}`}>
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
      {showActive && inRound && (
        <AtIcon
          className="active"
          value="star-2"
          size="20"
          color="#f1b53d"
        ></AtIcon>
      )}
      {realShowSetting && (
        <AtIcon
          className="setting"
          value="settings"
          size="20"
          color="#f2f2f2"
          onClick={() => {
            setActionSheetOpened(true);
          }}
        ></AtIcon>
      )}
      {/* 倒计时小于一定时间再显示，避免回合切换时的突兀 */}
      {showActive &&
        inRound &&
        roundCountDown <= MARTIAN_SHOW_ROUND_TIME_LIMIT && (
          <View className="at-row at-row__align--center count-down-box">
            <View
              className={`count-down ${roundCountDown < 10 ? "error" : ""}`}
            >
              {roundCountDown}
            </View>
          </View>
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
