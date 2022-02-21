import Taro, { useDidShow, useReady } from "@tarojs/taro";
import { getVedio30, useThrottle } from "@/utils";
import { useEffect, useRef } from "react";
import "./index.scss";

interface IProps {
  showAdFlag: boolean;
  afterAd: any;
}

export default function Index({ showAdFlag, afterAd }: IProps) {
  const showVideoAd = useRef<Function>(() => {});
  const videoAd = useRef(null);

  useEffect(() => {
    getVedio30((_videoAd, _showVideoAd) => {
      videoAd.current = _videoAd;
      showVideoAd.current = _showVideoAd;
    });
  }, []);

  const showAd = useThrottle(() => {
    // 播放视频广告
    showVideoAd.current();
    videoAd.current?.onClose(async ({ isEnded }) => {
      if (isEnded) {
        await afterAd();
      } else {
        Taro.showToast({
          title: "需要完整看完广告才能领取奖励",
          icon: "none",
          duration: 1500,
        });
      }
      videoAd.current?.offClose();
    });
  }, 3500);

  useEffect(() => {
    showAd();
  }, [showAdFlag]);

  return null;
}
