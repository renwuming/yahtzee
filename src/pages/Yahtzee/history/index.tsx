import { ScrollView, View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { AtDivider, AtIcon } from "taro-ui";
import "./index.scss";
import { PAGE_LEN, HISTORY_LEN } from "../../../const";
import { CallCloudFunction } from "../../../utils";
import GameItem from "../../../Components/GameItem";

export default function Index() {
  const [list1, setList1] = useState<Yahtzee.YahtzeeGameData[]>([]);
  const [pageNum1, setPageNum1] = useState<number>(0);
  const [page1End, setPage1End] = useState<boolean>(false);

  async function updateList1() {
    if (page1End) return;
    const list = await CallCloudFunction({
      name: "yahtzeeGetMyGames",
      data: {
        type: "history",
        skip: pageNum1 * PAGE_LEN,
        pageLength: PAGE_LEN,
      },
    });
    const newList = list1.concat(list);
    setList1(newList);
    setPageNum1(pageNum1 + 1);
    if (newList.length >= HISTORY_LEN || list.length < PAGE_LEN) {
      setPage1End(true);
    }
  }

  useEffect(() => {
    updateList1();
  }, []);

  return (
    <View className="history">
      <ScrollView
        className="scroll-view"
        scrollY={true}
        enableBackToTop={true}
        onScrollToLower={() => {
          updateList1();
        }}
      >
        {list1.map((data, index) => {
          return <GameItem game={data} index={index} type="history"></GameItem>;
        })}
        {page1End ? (
          <AtDivider
            className="divider"
            content={`只显示最近${HISTORY_LEN}个`}
            fontColor="#fff"
            lineColor="#fff"
          />
        ) : (
          <AtIcon
            className="loading"
            value="loading-3"
            size="36"
            color="#fff"
          ></AtIcon>
        )}
      </ScrollView>
    </View>
  );
}
