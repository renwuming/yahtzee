import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import { navigateTo } from "@/utils";

interface IProps {
  data: Player;
  colorType?: string;
}

export default function Index({ data, colorType = "white" }: IProps) {
  const { avatarUrl, nickName, openid } = data;

  function gotoHomePage() {
    navigateTo("", `homepage/index?openid=${openid}`);
  }

  return (
    <View className={`home-player`}>
      <View
        className={`player-info`}
        onClick={() => {
          gotoHomePage();
        }}
      >
        <Image className={`avatar`} src={avatarUrl}></Image>
        <Text className={colorType}>{nickName}</Text>
      </View>
    </View>
  );
}
