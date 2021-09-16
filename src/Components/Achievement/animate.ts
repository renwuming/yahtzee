import { Current } from "@tarojs/taro";

export function animate() {
  const selector = "#rose-0";
  Current.page.animate(
    selector,
    [
      { opacity: 0, scale: [0.7, 0.7], offset: 0 },
      { opacity: 1, scale: [1, 1], offset: 0.3 },
      { opacity: 1, scale: [1, 1], translateX: 200 },
    ],
    1500,
    () => {
      Current.page.clearAnimation(selector, function () {
        console.log("清除了.block上的所有动画属性");
      });
    }
  );
}
