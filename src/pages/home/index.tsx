import Taro, { useDidShow, useShareAppMessage } from "@tarojs/taro";
import { useState } from "react";
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

  useDidShow(() => {
    setShowModal(true);
  });

  const gameList = [
    {
      name: "拉密数字棋",
      imgUrl:
        "https://cdn.renwuming.cn/static/diceGames/imgs/covers/rummy-cover.jpg",
      navigateFn() {
        Taro.navigateToMiniProgram({
          appId: "wx12825b7bafc3db6e",
        });
      },
    },
    // {
    //   name: "拉密牌",
    //   imgUrl:
    //     "https://cdn.renwuming.cn/static/diceGames/imgs/covers/rummy-cover.jpg",
    //   pageType: "Rummy",
    //   pagePath: `hall/index`,
    // },
    // {
    //   name: "欲罢不能",
    //   imgUrl:
    //     "https://cdn.renwuming.cn/static/diceGames/imgs/covers/cantstop-cover.jpg",
    //   pageType: "CantStop",
    //   pagePath: `hall/index`,
    // },
    // {
    //   name: "神奇形色牌",
    //   imgUrl:
    //     "https://cdn.renwuming.cn/static/diceGames/imgs/covers/set-cover.jpg",
    //   pageType: "Set",
    //   pagePath: `hall/index`,
    // },
    // {
    //   name: "快艇骰子",
    //   imgUrl:
    //     "https://cdn.renwuming.cn/static/diceGames/imgs/covers/yahtzee-cover.jpg",
    //   pageType: "Yahtzee",
    //   pagePath: `hall/index`,
    // },
    // {
    //   name: "火星骰",
    //   imgUrl:
    //     "https://cdn.renwuming.cn/static/diceGames/imgs/covers/martian-cover.jpg",
    //   pageType: "Martian",
    //   pagePath: `hall/index`,
    // },
    {
      name: "截码战",
      imgUrl:
        "https://cdn.renwuming.cn/static/diceGames/imgs/covers/jmz-cover.jpg",
      navigateFn() {
        Taro.navigateToMiniProgram({
          appId: "wxfe74b714bde12b3f",
          path: "pages/hall/index",
        });
      },
    },
    {
      name: "电波同步",
      imgUrl:
        "https://cdn.renwuming.cn/static/diceGames/imgs/covers/wavelength-cover.jpg",
      navigateFn() {
        Taro.navigateToMiniProgram({
          appId: "wxfe74b714bde12b3f",
          path: "pages/WaveLength/hall/index",
        });
      },
    },
  ];
  return (
    <View className="home">
      <Text className="version">{VERSION}</Text>
      <MyPlayer></MyPlayer>
      <View className="game-list at-row at-row__align--center">
        {gameList.map((item) => {
          const { name, imgUrl, pageType, pagePath, navigateFn } = item;
          return (
            <View key={null} className="item-box at-col at-col-4">
              <AtButton
                onClick={() => {
                  getUserProfile(() => {
                    navigateFn ? navigateFn() : navigateTo(pageType, pagePath);
                  });
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
        <AtButton
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
        </AtButton>
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
              urls: ["https://cdn.renwuming.cn/static/jmz/group.jpg"],
            });
          }}
        >
          <View className="icon-btn">
            <Image mode="aspectFit" src={WechatIcon}></Image>
            <Text className="text">加群交流</Text>
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
              截止目前，【拉密数字棋】小游戏已经上线了一个单机版本，欢迎大家试玩，完整功能预计在“五一”之前完成。
            </Text>
            <Text>最后感谢大家对任同学小程序的支持，欢迎加群交流，谢谢！</Text>
          </View>
        </AtModalContent>
      </AtModal>
    </View>
  );
}
