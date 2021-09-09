export enum AchievementGameIndex {
  yahtzee,
  martian,
  cantstop,
}
export const MAX_PLAYERS = 4;

// 快艇骰子
export const ROUND_TIME_LIMIT = 65;
export const SHOW_ROUND_TIME_LIMIT = 60;
export const DICE_NUM = 5;
export const DICE_CHANCES_NUM = 3;
export const DEFAULT_DICE_LIST: DiceData[] = new Array(DICE_NUM).fill({
  value: 0,
});
export const PAGE_LEN = 10;
export const RANKING_LEN = 50;

export const DEFAULT_SCORES: Scores = {
  ones: null,
  twos: null,
  threes: null,
  fours: null,
  fives: null,
  sixes: null,
  sum: null,
  fourOfKind: null,
  fullhouse: null,
  miniStraight: null,
  straight: null,
  fiveOfKind: null,
};

// 火星骰
export const MARTIAN_ROUND_TIME_LIMIT = 65;
export const MARTIAN_SHOW_ROUND_TIME_LIMIT = 60;
export enum MartianStage {
  Dice = 1,
  Select,
}
export const MartianDiceMap = [
  null,
  "ufo",
  "chook",
  "cow",
  "man",
  "ufo",
  "tank",
];
// 欲罢不能
export const CANTSTOP_ROUND_TIME_LIMIT = 65;
export const CANTSTOP_SHOW_ROUND_TIME_LIMIT = 60;
export enum CantStopStage {
  Dice = 1,
  Select,
}
export const MAX_ROAD_NUM_CANTSTOP = 3;
export const ROAD_LIST = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((road) => ({
  road,
  num: getRoadNum(road),
}));
export function getRoadNum(road) {
  if (road < 2) return Infinity;
  if (road <= 7) return road * 2 - 1;
  return 27 - road * 2;
}
