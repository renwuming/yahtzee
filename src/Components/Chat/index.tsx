import Taro from "@tarojs/taro";
import { View, Text, Input, ScrollView } from "@tarojs/components";
import { useEffect, useMemo, useRef, useState } from "react";
import { AtButton, AtDrawer, AtIcon } from "taro-ui";
import clsx from "clsx";
import HallPlayer from "@/Components/HallPlayer";
import { isMe } from "@/utils";
import "./index.scss";
import {
  getDialogueList_Database,
  updateChatAction_Database,
  useChatApi,
} from "./api";

interface IProps {
  gameID: string;
  drawerShow?: boolean;
  showBarrage?: boolean;
  setDrawerShow?: any;
}

export default function ({
  gameID,
  drawerShow = false,
  showBarrage = true,
  setDrawerShow = () => {},
}: IProps) {
  return useMemo(
    () => (
      <Index
        gameID={gameID}
        drawerShow={drawerShow}
        showBarrage={showBarrage}
        setDrawerShow={setDrawerShow}
      ></Index>
    ),
    [gameID, drawerShow, showBarrage]
  );
}

function Index({
  gameID,
  drawerShow = false,
  showBarrage = true,
  setDrawerShow = () => {},
}: IProps) {
  const { openid } = Taro.getStorageSync("userInfo");

  const waiting = useRef<boolean>(false);
  const [bottomID, setBottomID] = useState<string>("");
  const [list, setList] = useState<ChatAction[]>([]);
  const [formData, setFormData] = useState<{ message: string }>({
    message: "",
  });
  const [barrageList, setBarrageList] = useState<ChatAction[]>([]);

  useChatApi(gameID, updateBarrageList);

  function updateBarrageList(list) {
    const newList = barrageList.concat(list);
    setBarrageList(newList);
  }

  async function submit() {
    if (waiting.current) return;
    if (formData.message === "") {
      Taro.showToast({
        title: "请填写内容",
        icon: "none",
        duration: 1000,
      });
      return;
    }
    try {
      waiting.current = true;
      await updateChatAction_Database(openid, gameID, formData.message);
      formData.message = "";
      setFormData(formData);
      updateDialogueList();
    } catch (err) {
      Taro.showToast({
        title: "提交失败",
        icon: "none",
        duration: 1000,
      });
    }
    waiting.current = false;
  }

  async function updateDialogueList(scrollToBottom: boolean = true) {
    const list = await getDialogueList_Database(gameID);
    setList(list);

    scrollToBottom && list.length > 0 && setBottomID(list[list.length - 1].id);
  }

  useEffect(() => {
    updateDialogueList(false);
  }, []);

  const onInput = ({ detail: { value } }) => {
    formData.message = value;
    setFormData(formData);
    return value;
  };

  useEffect(() => {
    if (drawerShow) {
      updateDialogueList();
    } else {
      setBottomID("");
    }
  }, [drawerShow]);

  return (
    <View className="chat-container">
      <AtDrawer
        show={drawerShow}
        mask
        right
        width="80%"
        onClose={() => {
          setDrawerShow(false);
        }}
      >
        <View className="drawer-content">
          <ScrollView
            scrollY
            scrollIntoView={bottomID}
            className="dialogue-box"
          >
            <View className="list-box">
              {list.map(({ player, message, id }) => (
                <Dialogue
                  key={id}
                  id={id}
                  player={player}
                  text={message}
                ></Dialogue>
              ))}
            </View>
          </ScrollView>
          <View className="input-box">
            <Input
              name="input"
              type="text"
              maxlength={100}
              cursorSpacing={50}
              value={formData.message}
              onInput={onInput}
            />
            <AtButton
              onClick={() => {
                submit();
              }}
            >
              发送
            </AtButton>
          </View>
        </View>
      </AtDrawer>
      {showBarrage && <BarrageList data={barrageList} />}
    </View>
  );
}

interface DialogueProps {
  id: string;
  player: Player;
  text: string;
}
function Dialogue({ id, player, text }: DialogueProps) {
  const { nickName, openid } = player;
  const me = isMe(openid);
  return (
    <View id={id} className={clsx("dialogue-item", me && "r-l")}>
      <Text className="nick">{nickName}</Text>
      <View className="text-box">
        <HallPlayer data={player} noNickName></HallPlayer>
        <View className="arrow"></View>
        <Text className="text">{text}</Text>
      </View>
    </View>
  );
}

interface BarrageListProps {
  data: ChatAction[];
}
function BarrageList({ data }: BarrageListProps) {
  return (
    <View id="barrage_container" className="barrage-container">
      {data.map((item, _index) => {
        const {
          player: { nickName },
          message,
          index,
        } = item;
        const topIndex = _index % 5;
        return (
          <View
            key={index}
            className={`barrage barrage-${index} top-${topIndex}`}
          >
            <Text>
              {nickName}：{message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
