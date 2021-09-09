import { View, Image } from "@tarojs/components";
import { AtIcon } from "taro-ui";
import "taro-ui/dist/style/components/flex.scss";
import "taro-ui/dist/style/components/icon.scss";
import "./index.scss";
import { ROAD_LIST } from "../../const";

interface IProps {
  roundProgress: number[];
  players: CantStop.CantStopPlayer[];
  roundRoad: number[];
}

export default function Index({
  roundProgress = [],
  players = [],
  roundRoad = [],
}: IProps) {
  const realRoundProgress = roundProgress.map((value, index) => {
    return roundRoad.includes(index) ? value : -1;
  });

  const progressList = players
    .filter((item) => item.progress)
    .map(({ progress }, index) => ({
      playerIndex: index,
      progress,
    }));

  return (
    <View className="cantstop-board">
      <Image
        className="bk-img"
        src="https://cdn.renwuming.cn/static/cantstop/imgs/cantstop-board.jpg"
        mode="aspectFill"
      />
      <View className="btn-box at-row step-row">
        {ROAD_LIST.map((data) => {
          const { road, num } = data;
          let roadReachTopPlayerIndex = -1;
          const stepList = progressList.map(({ playerIndex, progress }) => {
            let step = num - progress[road];
            if (step < 0) step = 0;
            if (step === 0) roadReachTopPlayerIndex = playerIndex;
            return { playerIndex, step };
          });
          return (
            <View className="at-col at-col-1 step-col">
              {new Array(num).fill(1).map((_, index) => {
                // 回合内，爬山进度
                let roundStep = num - realRoundProgress[road];
                if (roundStep < 0) roundStep = 0;
                const roundActive = roundStep === index;
                // 所有爬山进度
                const stepPlayerList = [];
                stepList.forEach(({ playerIndex, step }) => {
                  if (step === index) {
                    stepPlayerList.push(playerIndex);
                  }
                });
                return (
                  <View className={`step ${roundActive ? "active" : ""}`}>
                    {roundActive ? (
                      <AtIcon
                        className="star"
                        value="star-2"
                        size="18"
                        color="#fff"
                      ></AtIcon>
                    ) : roadReachTopPlayerIndex >= 0 ? (
                      <AtIcon
                        className={`star player-${roadReachTopPlayerIndex}`}
                        value="star-2"
                        size="18"
                      ></AtIcon>
                    ) : roundActive ? null : (
                      <View>
                        {stepPlayerList.map((playerIndex, index) => (
                          <AtIcon
                            className={`star player-${playerIndex} pos-${index}`}
                            value="star-2"
                            size="18"
                          ></AtIcon>
                        ))}
                      </View>
                    )}
                    {roadReachTopPlayerIndex >= 0 ||
                    roundActive ||
                    stepPlayerList.length >= 1
                      ? ""
                      : road}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}
