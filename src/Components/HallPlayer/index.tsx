import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import { navigateTo } from "@/utils";

interface IProps {
  data: Player;
  colorType?: string;
  noNickName?: boolean;
  clickable?: boolean;
  showOffline?: boolean;
}

export default function Index({
  data,
  colorType = "white",
  noNickName = false,
  clickable = true,
  showOffline = false,
}: IProps) {
  const { avatarUrl, nickName, openid, timeStamp } = data;

  const offline = showOffline && Date.now() - (timeStamp || 0) > 5000;

  function gotoHomePage() {
    navigateTo("", `homepage/index?openid=${openid}`);
  }

  return (
    <View className={`player`}>
      <View
        className={`player-info ${offline ? "offline" : ""}`}
        onClick={() => {
          clickable && gotoHomePage();
        }}
      >
        <Image className={`avatar`} src={avatarUrl}></Image>
        {noNickName ? null : <Text className={colorType}>{nickName}</Text>}
      </View>
    </View>
  );
}
