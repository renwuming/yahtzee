import { Context, createContext } from "react";
import { Bomb, Praise, Rose } from "@/Components/Gifts";

export const PlayerContext: Context<{
  gameID?: string;
  players?: Player[];
  initGameIndex?: number;
  playerIndex?: number;
  showScore?: boolean;
  showActive?: boolean;
  showOffline?: boolean;
  showSetting?: boolean;
  noNickName?: boolean;
  kickPlayer?: (openid: string) => void;
  roundCountDown?: string | number;
  showGift?: boolean;
}> = createContext({
  gameID: null,
  players: [],
  initGameIndex: -1,
  playerIndex: -1,
  showScore: false,
  showActive: false,
  showOffline: false,
  showSetting: false,
  noNickName: false,
  kickPlayer: () => {},
  roundCountDown: Infinity,
  showGift: false,
});

export enum AchievementGameIndex {
  yahtzee,
  martian,
  cantstop,
  set,
  rummy,
}

export const GIFT_LIST: GiftItem[] = [
  {
    type: "rose",
    icon: () => Rose(),
    price: 10,
  },
  {
    type: "bomb",
    icon: () => Bomb(),
    price: 10,
  },
  {
    type: "praise",
    icon: () => Praise(),
    price: 10,
  },
];

export const OFFLINE_DELAY = 5000;
export const ACTION_DELAY = 5000;
export const ANIMATION_BACKUP_SUM = 10;
export const ANIMATION_BACKUP_LIST = new Array(ANIMATION_BACKUP_SUM).fill(0);

export const MAX_PLAYERS = 4;
export const PAGE_LEN = 20;
export const RANKING_LEN = 60;
export const HISTORY_LEN = 100;

// 快艇骰子
export const ROUND_TIME_LIMIT = 65;
export const SHOW_ROUND_TIME_LIMIT = 60;
export const DICE_NUM = 5;
export const DICE_CHANCES_NUM = 3;
export const DEFAULT_DICE_LIST: Yahtzee.YahtzeeDiceData[] = new Array(
  DICE_NUM
).fill({
  value: 0,
});

export const DEFAULT_SCORES: Yahtzee.Scores = {
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

// Set
export const INIT_CARD_SUM = 12;
export const SET_TIME_LIMIT = 5 * 60;

// 拉密
export const RUMMY_ROUND_TIME_LIMIT = 65;
export const RUMMY_SHOW_ROUND_TIME_LIMIT = 60;
export enum RUMMY_AREA_STATUS {
  other,
  playground,
  playboard,
}
export enum RUMMY_SET_TYPE {
  straight,
  samevalue,
  all, // 可能是任何一种
}
