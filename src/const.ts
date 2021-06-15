export const DICE_NUM = 5;
export const DICE_CHANCES_NUM = 3;
export const DEFAULT_DICE_LIST: DiceData[] = new Array(DICE_NUM).fill({
  value: 0,
});

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
