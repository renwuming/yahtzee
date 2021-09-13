import Taro, { useReady } from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/flex.scss";
import "./index.scss";
// @ts-ignore
import GoldIcon from "../../assets/imgs/gold.png";
import { getWealthList_Database, gainWealth_Database } from "./wealthApi";
import { useEffect, useRef, useState } from "react";
import { getVedio15, getVedio30, useDebounce, useThrottle } from "../../utils";
import LoadPage from "../../Components/LoadPage";

export default function Index() {
  const [userInfo, setUserInfo] = useState<Player>(
    Taro.getStorageSync("userInfo")
  );
  const [wealthList, setWealthList] = useState<Wealth[]>([]);
  const showVideoAd = useRef<Function>(() => {});
  const videoAd = useRef(null);

  const { openid, wealthRecord } = userInfo;

  useReady(() => {
    getVedio15((_videoAd, _showVideoAd) => {
      videoAd.current = _videoAd;
      showVideoAd.current = _showVideoAd;
    });
  });

  useEffect(() => {
    getWealthList_Database().then((list) => {
      list = handleWealthList(list, wealthRecord);
      setWealthList(list);
    });
  }, [userInfo]);

  const _GainWealth = useThrottle(gainWealth, 3500);

  // 获取福利
  async function gainWealth(id: string, needVideo: boolean) {
    if (needVideo) {
      // 播放视频广告
      showVideoAd.current();
      videoAd.current?.onClose(async ({ isEnded }) => {
        if (isEnded) {
          await realGainWealth(id);
        } else {
          Taro.showToast({
            title: "需要完整看完广告才能领取奖励",
            icon: "none",
            duration: 1500,
          });
        }
        videoAd.current?.offClose();
      });
    } else {
      await realGainWealth(id);
    }
  }

  async function realGainWealth(id: string) {
    const userInfo = await gainWealth_Database(id, openid);
    Taro.setStorageSync("userInfo", userInfo);
    setUserInfo(userInfo);
    Taro.showToast({
      title: "获取奖励成功",
      icon: "success",
      duration: 1500,
    });
  }

  function handleWealthList(list: Wealth[], wealthRecord): Wealth[] {
    list.forEach((item) => {
      const { _id, maxTimes, intro } = item;
      const gainTimes = wealthRecord?.[_id]?.times || 0;
      const remainingTimes =
        maxTimes - gainTimes >= 0 ? maxTimes - gainTimes : 0;

      item.remainingTimes = remainingTimes;
      if (maxTimes > 1) {
        item.intro = `${intro}，剩余${remainingTimes}次`;
      }
    });

    return list;
  }

  return (
    <View className="wealth at-row at-row__align--center">
      <LoadPage setUserInfo={setUserInfo}></LoadPage>
      {wealthList.map((item) => {
        const { _id, type, amount, intro, needVideo, remainingTimes } = item;
        return (
          <View className="item-box at-col at-col-4">
            <View className="item">
              <View className="top">
                {type === "gold" ? (
                  <Image className="img" src={GoldIcon} mode="aspectFit" />
                ) : null}
                <Text className="amount">x{amount}</Text>
                <Text className="intro">{intro}</Text>
              </View>
              <View className="bottom">
                <AtButton
                  onClick={() => {
                    _GainWealth(_id, needVideo);
                  }}
                  disabled={remainingTimes <= 0}
                >
                  {needVideo && (
                    <AtIcon value="video" size="16" color="#fff"></AtIcon>
                  )}{" "}
                  领取
                </AtButton>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
