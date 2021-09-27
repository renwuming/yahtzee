interface SeasonRank {
  name: string;
  list: SeasonRankPlayer[];
  desTitle: string;
  desContent: string;
}

interface SeasonRankPlayer extends Player {
  rankType: string;
  rankLevel: number;
  rankImgUrl?: string;
}

interface Wealth {
  _id: string;
  type: string;
  amount: number;
  intro: string;
  maxTimes: number;
  needVideo: boolean;
  online: boolean;
  remainingTimes: number;
}

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

type AnyGameData = GameData | Martian.GameData | CantStop.GameData;

interface Player {
  nickName: string;
  avatarUrl: string;
  openid?: string;
  lastScoreType?: string;
  scores?: Scores;
  default?: boolean;
  sumScore?: number;
  inRound?: boolean;
  timeStamp?: number;
  achievement?: any;
  wealth?: any;
  wealthRecord?: any;
}

declare namespace Martian {
  interface DiceData {
    value: number;
  }
  interface GameBaseData {
    _id: string;
    owner: Player;
    players: Player[];
    start?: boolean;
    roundPlayer?: number;
    round: Round;
    winners?: number[];
    end?: boolean;
    roundSum?: number;
    roundTimeStamp: number;

    _createTime: Date;
    _updateTime: Date;
  }

  interface GameData extends GameBaseData {
    own: boolean;
    inGame: boolean;
    inRound: boolean;
    playerIndex: number;
    canJoin: boolean;
  }

  interface Round {
    roundTimeStamp: number;
    stage: number;
    diceNum: number;
    diceList: DiceData[];
    tankList: DiceData[];
    ufoList: DiceData[];
    awardList: DiceData[];
    roundScore: number;
    ufoCanWin: boolean;
    shouldRetreat: boolean;
    canSelect: boolean;
    cantSelectAnyUfo: boolean;
    allToSelectIsUfo: boolean;
    ufoWin: boolean;
  }
}

declare namespace CantStop {
  type DiceData = number;
  interface GameBaseData {
    _id: string;
    owner: Player;
    players: CantStopPlayer[];
    start?: boolean;
    roundPlayer?: number;
    round: Round;
    winner?: number;
    end?: boolean;
    roundSum?: number;
    roundTimeStamp: number;

    _createTime: Date;
    _updateTime: Date;
  }

  interface GameData extends GameBaseData {
    own: boolean;
    inGame: boolean;
    inRound: boolean;
    playerIndex: number;
    canJoin: boolean;
  }
  interface Round {
    roundTimeStamp: number;
    stage: number;
    diceList: DiceData[];
    roundProgress: number[];
    roundRoad: number[];
  }
  interface CantStopPlayer extends Player {
    progress: number[];
  }
}
