import { View, Image, Text } from "@tarojs/components";
import { useContext, useState } from "react";
import { AtActionSheet, AtActionSheetItem, AtIcon } from "taro-ui";
import clsx from "clsx";
// @ts-ignore
import FreezingIcon from "@/assets/imgs/freezing.png";
import {
  AchievementGameIndex,
  OFFLINE_DELAY,
  PlayerContext,
} from "../../const";
import Achievement from "../Achievement";
import "./index.scss";

interface IProps {
  data: AnyPlayer;
  index?: number;
  colorType?: string;
}

export default function Index({
  data,
  index = -1,
  colorType = "white",
}: IProps) {
  const playerContext = useContext(PlayerContext);
  const {
    showScore,
    showSetting,
    showOffline,
    showActive,
    noNickName,
    kickPlayer,
    initGameIndex,
    onItemClick,
    activePlayer,
  } = playerContext;

  const realShowSetting = index !== 0 && showSetting;
  const {
    avatarUrl,
    nickName,
    sumScore,
    inRound,
    timeStamp,
    openid,
    successSum,
    failSum,
    cardList,
    icebreaking,
  } = data;
  const [isAchievementOpened, setAchievementOpened] = useState<boolean>(false);
  const [isActionSheetOpened, setActionSheetOpened] = useState<boolean>(false);

  const offline = showOffline && Date.now() - (timeStamp || 0) > OFFLINE_DELAY;

  function doShowAchievement() {
    setAchievementOpened(true);
  }
  function hideAchievement() {
    setAchievementOpened(false);
  }

  const isMartianPlayer = initGameIndex === AchievementGameIndex.martian;
  const isSetPlayer = initGameIndex === AchievementGameIndex.set;
  const isRummyPlayer = initGameIndex === AchievementGameIndex.rummy;

  return (
    <View
      className={clsx(
        "common-game-player",
        isMartianPlayer && "martian-player",
        isRummyPlayer && "rummy-player",
        showActive && inRound && "active",
        activePlayer === index && "zIndexActive"
      )}
    >
      <View className="at-row at-row__align--center">
        <View
          className={`player-info ${offline ? "offline" : ""}`}
          onClick={() => {
            doShowAchievement();
            onItemClick(index);
          }}
        >
          <Image
            className="avatar"
            id={`player-${index}-avatar`}
            src={avatarUrl}
          ></Image>
          {noNickName ? null : <Text className={colorType}>{nickName}</Text>}
          {isRummyPlayer && cardList && (
            <View className="score rummy-card-num">
              <Text className="score rummy-card-num">{cardList.length}</Text>
            </View>
          )}
        </View>
        {showScore && !isRummyPlayer && (
          <View className="score">
            <Text>{sumScore}</Text>
          </View>
        )}
        {realShowSetting && (
          <AtIcon
            className={clsx("setting", isRummyPlayer && "rummy-setting")}
            value="settings"
            size="18"
            color={isRummyPlayer ? "#fff" : "#176999"}
            onClick={() => {
              setActionSheetOpened(true);
            }}
          ></AtIcon>
        )}
        {isRummyPlayer && showScore && !icebreaking && (
          <Image
            className="freezing-icon"
            mode="aspectFit"
            src={FreezingIcon}
          ></Image>
        )}
      </View>
      {isSetPlayer && showScore && (
        <View className="set-game-info">
          <View className="at-row at-row__align--center">
            <Text className="text">成功</Text>
            <Text className="number">{successSum || 0}</Text>
          </View>
          <View className="at-row at-row__align--center">
            <Text className="text">失误</Text>
            <Text className="number">{failSum || 0}</Text>
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
