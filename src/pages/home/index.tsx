import Taro, { useDidShow, useShareAppMessage } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { View, Image, Text } from "@tarojs/components";
import {
  AtButton,
  AtIcon,
  AtModal,
  AtModalContent,
  AtModalHeader,
} from "taro-ui";
import { getUserProfile, navigateTo, VERSION } from "@/utils";
import MyPlayer from "../../Components/MyPlayer";
// @ts-ignore
import RankIcon from "../../assets/imgs/rank.png";
// @ts-ignore
import WechatIcon from "../../assets/imgs/wechat.png";
import "./index.scss";
import { getGameList } from "./api";

export default function Index() {
  // 设置分享
  useShareAppMessage(() => {
    const title = "桌游大全，各种欢乐桌游，快来玩吧！";
    return {
      title,
      path: `/pages/home/index`,
      imageUrl: "https://cdn.renwuming.cn/static/yahtzee/imgs/cover.jpg",
    };
  });

  const [showModal, setShowModal] = useState<boolean>(true);
  const [gameList, setGameList] = useState([]);

  useEffect(() => {
    getGameList().then((list) => {
      list = list.filter((item) => item.online);
      setGameList(list);
    });
  }, []);

  function openPage(data) {
    const { appId, path } = data;

    if (appId) {
      Taro.navigateToMiniProgram({
        appId,
        path,
      });
    } else {
      Taro.navigateTo({
        url: path,
      });
    }
  }

  return (
    <View className="home">
      {/* <Text className="version">{VERSION}</Text> */}
      {/* <MyPlayer></MyPlayer> */}
      <View className="game-list at-row at-row__align--center">
        {gameList.map((item) => {
          const { name, imgUrl, navigateFn, pageType, pagePath } = item;
          return (
            <View key={null} className="item-box at-col at-col-4">
              <AtButton
                onClick={() => {
                  openPage(item);
                }}
              >
                <View className="item">
                  <View className="top">
                    <Image mode="aspectFit" src={imgUrl}></Image>
                  </View>
                  <View className="bottom">
                    <Text>{name}</Text>
                  </View>
                </View>
              </AtButton>
            </View>
          );
        })}
      </View>
      <View className="bottom-list at-row at-row__align--center">
        <AtButton
          onClick={() => {
            setShowModal(true);
          }}
        >
          <View className="icon-btn">
            <AtIcon value="message" size="32" color="#4871b6"></AtIcon>
            <Text className="text">公告</Text>
          </View>
        </AtButton>
        {/* <AtButton
          onClick={() => {
            getUserProfile(() => {
              navigateTo("", `seasonRank/index`);
            });
          }}
        >
          <View className="icon-btn">
            <Image mode="aspectFit" src={RankIcon}></Image>
            <Text className="text">排行榜</Text>
          </View>
        </AtButton> */}
        {/* <AtButton
          onClick={() => {
            navigateTo("", `MessageBoard/index`);
          }}
        >
          <View className="icon-btn">
            <AtIcon value="edit" size="32" color="#4871b6"></AtIcon>
            <Text className="text">留言板</Text>
          </View>
        </AtButton> */}
        <AtButton
          onClick={() => {
            Taro.previewImage({
              urls: [
                `https://cdn.renwuming.cn/static/jmz/group.jpg?v=${Date.now()}`,
              ],
            });
          }}
        >
          <View className="icon-btn">
            <Image mode="aspectFit" src={WechatIcon}></Image>
            <Text className="text">加群交流</Text>
          </View>
        </AtButton>
        <AtButton
          onClick={() => {
            Taro.navigateToMiniProgram({
              appId: "wx12825b7bafc3db6e",
            });
          }}
        >
          <View className="icon-btn">
            <AtIcon value="star-2" size="32" color="#4871b6"></AtIcon>
            <Text className="text">新版拉密</Text>
          </View>
        </AtButton>
        {/* <AtButton
          onClick={() => {
            Taro.previewImage({
              urls: ["https://cdn.renwuming.cn/static/reward.jpg"],
            });
          }}
        >
          <View className="icon-btn">
            <Image mode="aspectFit" src={RewardIcon}></Image>
            <Text className="text">打赏作者</Text>
          </View>
        </AtButton> */}
      </View>

      <AtModal
        isOpened={showModal}
        onClose={() => {
          setShowModal(false);
        }}
      >
        <AtModalHeader>
          <Text>重要通知</Text>
        </AtModalHeader>
        <AtModalContent>
          <View className="notice-box">
            <Text>由于微信审核的原因，本小程序大部分内容已经停运。</Text>
            <Text>不要担心，我们会将内容陆续迁移到新的小游戏。</Text>
            <Text>
              截止目前，【拉密数字棋】小游戏已经上线了一个全新的版本，欢迎大家试玩！
            </Text>
            <Text>最后感谢大家对任同学小程序的支持，欢迎加群交流，谢谢！</Text>
          </View>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
