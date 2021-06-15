import { View, Image } from "@tarojs/components";
import "./index.scss";

interface IProps {
  data: Player;
}

export default function Index({ data }: IProps) {
  const { avatarUrl } = data;
  return (
    <View className="player">
      <Image className={`avatar`} src={avatarUrl}></Image>
    </View>
  );
}
