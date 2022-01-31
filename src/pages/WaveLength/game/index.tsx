import { View, Image, Text } from "@tarojs/components";
import { AtButton, AtFab } from "taro-ui";
import PlayerList from "@/Components/CommonPlayerList";
import { AchievementGameIndex, PlayerContext } from "@/const";
import Taro, { getCurrentInstance, useShareAppMessage } from "@tarojs/taro";
import { getUserProfile } from "@/utils";
import "./index.scss";

export default function Index() {
  const id = getCurrentInstance()?.router?.params?.id;
  // 设置分享
  useShareAppMessage(() => {
    const { nickName } = Taro.getStorageSync("userInfo");
    return {
      title: `${nickName}邀请你来玩拉密牌！`,
      path: `/pages/Rummy/game/index?id=${id}`,
      imageUrl:
        "https://cdn.renwuming.cn/static/diceGames/imgs/rummy-cover.png",
    };
  });

  const gameData = {
    own: true,
    canJoin: true,
  };
  const {
    start,
    own,
    playerIndex,
    end,
    inGame,
    CoMode,
    roundSum,
    roundCount,
    teams,
    winner,
    coComment,
    stageData,
    countdown,

    canJoin,
  } = gameData;
  const players = new Array(8).fill(Taro.getStorageSync("userInfo"));

  return (
    <View className="wavelength-game">
      <View className="top-container">
        <Image
          className="team-img"
          mode="aspectFit"
          src="https://cdn.renwuming.cn/static/wavelength/imgs/team1.png"
        ></Image>
        <View className="player-list">
          <PlayerContext.Provider
            value={{
              gameID: id,
              players,
              playerIndex,
              kickPlayer(openid) {
                // handleGameAction(id, "kickPlayer", {
                //   openid,
                // });
              },
              initGameIndex: AchievementGameIndex.wavelength,
              showScore: start,
              showSetting: own && !start,
              showActive: start,
              showOffline: false, // !end,
              showGift: !end && inGame,
              noNickName: true,
            }}
          >
            <PlayerList players={players}></PlayerList>
          </PlayerContext.Provider>
        </View>
        <Image
          className="team-img"
          mode="aspectFit"
          src="https://cdn.renwuming.cn/static/wavelength/imgs/team2.png"
        ></Image>
      </View>
      {gameData && !start && (
        <View className="btn-box">
          {own ? (
            <View>
              <AtButton
                type="primary"
                onClick={() => {
                  // startBtnClick();
                }}
              >
                开始
              </AtButton>
            </View>
          ) : inGame ? (
            <AtButton
              type="secondary"
              onClick={() => {
                getUserProfile(() => {
                  // handleGameAction(id, "leaveGame");
                });
              }}
            >
              离开
            </AtButton>
          ) : (
            <AtButton
              type="secondary"
              onClick={() => {
                getUserProfile(() => {
                  // handleGameAction(id, "joinGame");
                });
              }}
              disabled={!canJoin}
            >
              加入
            </AtButton>
          )}
          <AtButton type="secondary" openType="share">
            邀请朋友
          </AtButton>
        </View>
      )}
    </View>
  );
}
