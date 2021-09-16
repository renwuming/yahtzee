import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/action-sheet.scss";
import Achievement from "../../Components/Achievement";
import { useMemo, useState } from "react";
import { AtActionSheet, AtActionSheetItem, AtIcon } from "taro-ui";
import {
  AchievementGameIndex,
  MARTIAN_SHOW_ROUND_TIME_LIMIT,
} from "../../const";
// @ts-ignore
import roseImg from "../../assets/imgs/rose.png";

interface IProps {
  data: CantStop.CantStopPlayer;
  index?: number;
  showActive?: boolean;
  showOffline?: boolean;
  showAchievement?: boolean;
  showSetting?: boolean;
  kickPlayer?: (openid: string) => void;
  colorType?: string;
  roundCountDown?: string | number;
  showGift?: boolean;
}

export default function Index({
  data,
  showActive = false,
  showOffline = false,
  showAchievement = true,
  showSetting = false,
  kickPlayer = () => {},
  colorType = "white",
  index = -1,
  roundCountDown,
  showGift = false,
}: IProps) {
  const { avatarUrl, nickName, inRound, timeStamp, openid } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);
  const [isActionSheetOpened, setActionSheetOpened] = useState<boolean>(false);

  const offline = useMemo(() => {
    return showOffline && Date.now() - (timeStamp || 0) > 5000;
  }, [data]);

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
        <View className="gift-box">
          <Image
            id={`rose-${index}`}
            className="rose"
            src={roseImg}
            mode="aspectFit"
          />
        </View>
        <Image className={`avatar`} src={avatarUrl}></Image>
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
      {showSetting && (
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
        isOpened={isAchievementOpened}
        onClose={hideAchievement}
        initGameIndex={AchievementGameIndex.cantstop}
        showGift={showGift}
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
