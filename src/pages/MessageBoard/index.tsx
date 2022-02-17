import Taro from "@tarojs/taro";
import { View, Text, ScrollView } from "@tarojs/components";
import { useEffect, useRef, useState } from "react";
import { AtButton, AtTextarea, AtIcon, AtDivider } from "taro-ui";
import { PAGE_LEN } from "@/const";
import PlayerItem from "@/Components/HallPlayer";
import { getBoardMessages, getNotice, submitBoardMessage } from "./api";
import "./index.scss";

export default function Index() {
  const waiting = useRef<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [list, setList] = useState<BoardMessage[]>([]);
  const [pageNum, setPageNum] = useState<number>(0);
  const [pageEnd, setPageEnd] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");

  async function updateList() {
    if (pageEnd) return;
    const _list = await getBoardMessages(pageNum);
    const newList = list.concat(_list);
    setList(newList);
    setPageNum(pageNum + 1);
    if (_list.length < PAGE_LEN) {
      setPageEnd(true);
    }
  }

  useEffect(() => {
    updateList();
    getNotice().then((notice) => {
      setNotice(notice);
    });
  }, []);

  async function submit() {
    if (waiting.current) return;
    if (message === "") {
      Taro.showToast({
        title: "请填写留言内容",
        icon: "none",
        duration: 1500,
      });
      return;
    }
    try {
      waiting.current = true;
      await submitBoardMessage(message);
      setMessage("");
      Taro.showToast({
        title: "提交成功",
        icon: "success",
        duration: 1500,
      });
      resetList();
    } catch (err) {
      Taro.showToast({
        title: "提交失败",
        icon: "none",
        duration: 1500,
      });
    }
    waiting.current = false;
  }

  async function resetList() {
    setPageEnd(false);
    const _list = await getBoardMessages(0);
    setList(_list);
    setPageNum(1);
    if (_list.length < PAGE_LEN) {
      setPageEnd(true);
    }
  }

  const onChange = (msg) => {
    setMessage(msg);
    return msg;
  };
  return (
    <View className="message-board">
      <View className="notice-box">
        <Text>{notice}</Text>
      </View>
      <ScrollView
        className="scroll-view"
        scrollY
        enableBackToTop
        onScrollToLower={() => {
          updateList();
        }}
      >
        {list.map((data) => {
          const { _id, message, submitter } = data;
          return (
            <View className="msg-item" key={_id}>
              <PlayerItem data={submitter} colorType="black"></PlayerItem>
              <Text>{message}</Text>
            </View>
          );
        })}
        {pageEnd ? (
          <AtDivider
            className="divider"
            content="没有更多了"
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
      <AtTextarea
        className="msg-textarea"
        value={message}
        onChange={onChange}
        maxLength={200}
        placeholder="您的建议/问题是..."
      />
      <AtButton
        type="primary"
        circle
        onClick={() => {
          submit();
        }}
      >
        提交
      </AtButton>
    </View>
  );
}
