import Taro, { Current } from "@tarojs/taro";

export function animate() {
  const selector = "#rose-0";
  const node = Taro.createSelectorQuery().select(selector);
  console.log(node);
  Current.page.animate(
    selector,
    [
      { opacity: 0, scale: [0.7, 0.7], translateX: 0, offset: 0 },
      { opacity: 1, scale: [1, 1], translateX: 0, offset: 0.15 },
      { opacity: 1, scale: [1, 1], translateX: "470rpx", offset: 0.6 },
      { opacity: 1, scale: [1, 1], translateX: "470rpx" },
    ],
    1500,
    function () {
      console.log("清除了.block上的所有动画属性");
    }
    // () => {
    //   console.log("清除了.block上的所有动画属性");
    //   Current.page.clearAnimation(
    //     selector,
    //     { opacity: true, scale: true, translateX: true },
    //     function () {
    //       console.log("清除了.block上的所有动画属性");
    //     }
    //   );
    // }
  );
}
