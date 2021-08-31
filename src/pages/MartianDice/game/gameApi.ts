import { MartianDice, MartianDiceMap } from "../../../const";

export function getDiceList(n: number): DiceData[] {
  const list = [];
  for (let index = 0; index < n; index++) {
    const value = Math.ceil(Math.random() * 6);
    list.push(MartianDiceMap[value] === "ufo" ? MartianDice.ufo : value);
  }
  return list.sort().map((value) => ({
    value: value,
  }));
}

export function handleDiceResultList(list: DiceData[]): {
  tankList: DiceData[];
  ufoList: DiceData[];
  otherList: DiceData[];
  needUfoNum: number;
  shouldRetreat: boolean;
} {
  const tankList = [];
  const ufoList = [];
  const otherList = [];
  list.forEach((item) => {
    const { value } = item;
    if (value === MartianDice.tank) tankList.push(item);
    else if (value === MartianDice.ufo) ufoList.push(item);
    else otherList.push(item);
  });

  const needUfoNum = tankList.length - ufoList.length;
  const awardKindsNum = getKindsNum(otherList);
  const ufoWin = ufoList.length >= tankList.length;
  const shouldRetreat = awardKindsNum === 3 && ufoWin;

  return {
    tankList,
    ufoList,
    otherList,
    needUfoNum: needUfoNum > 0 ? needUfoNum : 0,
    shouldRetreat,
  };
}

function getKindsNum(list: DiceData[]): number {
  return Array.from(new Set(list.map((item) => item.value))).length;
}

export function calculateScore(
  tankList: DiceData[],
  ufoList: DiceData[],
  otherList: DiceData[]
): number {
  if (tankList.length > ufoList.length) return 0;
  const basicScores = otherList.length;
  const bonus =
    Array.from(new Set(otherList.map((item) => item.value))).length >= 3
      ? 3
      : 0;
  return basicScores + bonus;
}
