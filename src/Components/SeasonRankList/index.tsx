import { ScrollView, View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon } from "taro-ui";
import PlayerItem from "@/Components/HallPlayer";
import { PAGE_LEN, SEASON_RANKING_LEN } from "@/const";
import { getSeasonRankData } from "@/utils";
import "./index.scss";

interface RankItemProps {
  index: number;
  data: SeasonRankPlayerData;
}

function RankItem({ data }: RankItemProps) {
  const { score, rankImgUrl } = data;
  return (
    <View key="rank" className="rank-item">
      <Image className="level-img" src={rankImgUrl} mode="aspectFit"></Image>
      <View className="user-box">
        <PlayerItem data={data}></PlayerItem>
      </View>
      <View className="column-right">
        <Text className="score-title">赛季积分</Text>
        <Text className="score">{score}</Text>
      </View>
    </View>
  );
}

interface IProps {
  game: string;
}

const gameNameMap = {
  rummy: "拉密牌",
};
export default function Index({ game }: IProps) {
  const [rankName, setRankName] = useState<string>("");
  const [list, setList] = useState<SeasonRankPlayerData[]>([]);
  const [pageNum, setPageNum] = useState<number>(0);
  const [pageEnd, setPageEnd] = useState<boolean>(false);

  async function updateList() {
    if (pageEnd) return;
    const { name, list: _list } = await getSeasonRankData(game, pageNum);
    setRankName(name);
    const newList = list.concat(_list);
    setList(newList);
    setPageNum(pageNum + 1);
    if (newList.length >= SEASON_RANKING_LEN || _list.length < PAGE_LEN) {
      setPageEnd(true);
    }
  }

  useEffect(() => {
    updateList();
  }, []);

  const gameName = gameNameMap[game];

  return (
    <View className="season-ranking">
      <View className="rank-item rank-title">
        <Text className="score-title">
          {rankName}赛季 · {gameName}
        </Text>
      </View>
      <ScrollView
        className="scroll-view"
        scrollY
        enableBackToTop
        onScrollToLower={() => {
          updateList();
        }}
      >
        {list.map((data, index) => {
          return (
            <RankItem key={data.openid} data={data} index={index}></RankItem>
          );
        })}
        {pageEnd ? (
          <AtDivider
            className="divider"
            content={`只显示前${SEASON_RANKING_LEN}名`}
            fontColor="#666"
            lineColor="#666"
          />
        ) : (
          <AtIcon
            className="loading"
            value="loading-3"
            size="36"
            color="#666"
          ></AtIcon>
        )}
      </ScrollView>
    </View>
  );
}
