import Taro from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { AtButton, AtIcon } from "taro-ui";
import "./index.scss";
// @ts-ignore
import GoldIcon from "../../assets/imgs/gold.png";
import { getWealthList_Database, gainWealth_Database } from "./wealthApi";
import { useEffect, useRef, useState } from "react";
import LoadPage from "../../Components/LoadPage";
import Ad from "@/Components/Ad";

export default function Index() {
  const [userInfo, setUserInfo] = useState<Player>(
    Taro.getStorageSync("userInfo")
  );
  const [wealthList, setWealthList] = useState<Wealth[]>([]);
  const [showAdFlag, setShowAdFlag] = useState<boolean>(false);
  const wealthID = useRef<string>(null);

  const { openid, wealthRecord } = userInfo;

  useEffect(() => {
    getWealthList_Database().then((list) => {
      list = handleWealthList(list, wealthRecord);
      setWealthList(list);
    });
  }, [userInfo]);

  // 获取福利
  async function realGainWealth() {
    const userInfo = await gainWealth_Database(wealthID.current, openid);
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
      <Ad showAdFlag={showAdFlag} afterAd={realGainWealth} />
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
                    wealthID.current = _id;
                    if (needVideo) {
                      setShowAdFlag(!showAdFlag);
                    } else {
                      realGainWealth();
                    }
                  }}
                  disabled={remainingTimes <= 0}
                >
                  {needVideo && (
                    <AtIcon value="video" size="16" color="#fff"></AtIcon>
                  )}
                  {needVideo && " "}
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
