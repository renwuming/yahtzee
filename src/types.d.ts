interface DiceData {
  value: number;
  freezing?: boolean;
}

interface Scores {
  ones: number;
  twos: number;
  threes: number;
  fours: number;
  fives: number;
  sixes: number;
  sum: number;
  fourOfKind: number;
  fullhouse: number;
  miniStraight: number;
  straight: number;
  fiveOfKind: number;
}

interface NewScore {
  type: string;
  score: number;
}

interface GameBaseData {
  _id: string;
  owner: Player;
  players: Player[];
  start?: boolean;
  roundPlayer?: number;
  chances?: number;
  diceList?: DiceData[];
  winner?: number;
  end?: boolean;
  roundTimeStamp: number;

  _createTime: Date;
  _updateTime: Date;
}

interface GameData extends GameBaseData {
  own: boolean;
  inGame: boolean;
  inRound: boolean;
  roundScores: Scores;
  otherScores: Scores;
  playerIndex: number;
}

interface Player {
  nickName: string;
  avatarUrl: string;
  openid?: string;
  lastScoreType?: string;
  scores?: Scores;
  default?: boolean;
  sumScore?: number;
  inRound?: boolean;
  singleNum: number;
  maxSingleSum: number;
  multiNum: number;
  maxMultiSum: number;
  multiWinSum: number;
  multiWinRateValue: number;
  multiWinRate: string;
  highScore: number;
  timeStamp: number;
}
