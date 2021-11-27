interface GiftAction {
  index?: number;
  createdAt: Date;
  sender: string;
  receiver: string;
  type: string;
}
interface GiftItem {
  type: string;
  icon: () => {};
  price: number;
}
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
  roundTimeStamp?: number;

  _createTime: Date;
  _updateTime: Date;
}

interface GameData extends GameBaseData {
  own: boolean;
  inGame: boolean;
  inRound?: boolean;
  roundScores?: Scores;
  otherScores?: Scores;
  playerIndex: number;
}

type AnyGameData = GameData &
  Martian.GameData &
  CantStop.GameData &
  Set.GameData;
type AnyPlayer = Player & CantStop.CantStopPlayer & Set.SetPlayer;

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
  achievement?: Achievement;
  gift?: Gift;
  wealth?: any;
  wealthRecord?: any;
}

interface Gift {
  receive: {
    [Name: string]: number;
  };
  send: {
    [Name: string]: number;
  };
  receiveFrom: {
    [Name: string]: {
      [Openid: string]: number;
    };
  };
  sendTo: {
    [Name: string]: {
      [Openid: string]: number;
    };
  };
}

interface Achievement {
  [T: string]: AchievementItem;
}
interface AchievementItem {
  bestTime?: number;
  minRoundSum?: number;
  highScore?: number;
  singleNum: number;
  multiNum: number;
  multiWinSum: number;
  multiWinRate: number;
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
    progress?: number[];
  }
}

declare namespace Set {
  interface SetCardData {
    index: number;
    color: string;
    shape: string;
    fill: string;
    n: number;
  }
  interface GameBaseData {
    _id: string;
    owner: Player;
    players: Player[];
    start?: boolean;
    startTime?: Date | number;
    winners?: number[];
    end?: boolean;
    gameCardList?: SetCardData[];
    reserveCardList?: SetCardData[];
    timer?: boolean;

    _createTime: Date;
    _updateTime: Date;
  }
  interface GameData extends GameBaseData {
    own: boolean;
    inGame: boolean;
    playerIndex: number;
    canJoin: boolean;
  }
  interface SetPlayer extends Player {
    successSum?: number;
    failSum?: number;
  }
}
