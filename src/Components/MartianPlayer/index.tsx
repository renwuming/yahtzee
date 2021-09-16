import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import "taro-ui/dist/style/components/modal.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/action-sheet.scss";
import Achievement from "../../Components/Achievement";
import { useMemo, useState } from "react";
import { AtActionSheet, AtActionSheetItem, AtIcon } from "taro-ui";
import { AchievementGameIndex } from "../../const";

interface IProps {
  data: Player;
  showScore?: boolean;
  showActive?: boolean;
  showOffline?: boolean;
  showAchievement?: boolean;
  showSetting?: boolean;
  kickPlayer?: (openid: string) => void;
  colorType?: string;
  showGift?: boolean;
}

export default function Index({
  data,
  showScore = false,
  showActive = false,
  showOffline = false,
  showAchievement = true,
  showSetting = false,
  kickPlayer = () => {},
  colorType = "white",
  showGift = false,
}: IProps) {
  const { avatarUrl, nickName, sumScore, inRound, timeStamp, openid } = data;
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
    <View className={`martian-player ${showActive && inRound ? "active" : ""}`}>
      <View
        className={`player-info ${offline ? "offline" : ""}`}
        onClick={() => {
          doShowAchievement();
        }}
      >
        <Image className={`avatar`} src={avatarUrl}></Image>
        <Text className={colorType}>{nickName}</Text>
      </View>
      {showScore && (
        <View className="score">
          <Text>{sumScore}</Text>
        </View>
      )}
      {showSetting && (
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
        isOpened={isAchievementOpened}
        onClose={hideAchievement}
        initGameIndex={AchievementGameIndex.martian}
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
