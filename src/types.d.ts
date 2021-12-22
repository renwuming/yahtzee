type AnyGameData =
  | Yahtzee.YahtzeeGameData
  | Martian.MartianGameData
  | CantStop.CantStopGameData
  | Set.SetGameData
  | Rummy.RummyGameData;
type AnyPlayer = Yahtzee.YahtzeePlayer &
  CantStop.CantStopPlayer &
  Set.SetPlayer &
  Rummy.RummyPlayer;

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

interface Player {
  nickName: string;
  avatarUrl: string;
  openid?: string;
  lastScoreType?: string;
  default?: boolean;
  sumScore?: number;
  inRound?: boolean;
  timeStamp?: number;
  achievement?: Achievement;
  gift?: Gift;
  wealth?: any;
  wealthRecord?: any;
}
interface GameBaseData {
  _id: string;
  owner: Player;
  start?: boolean;
  end?: boolean;
  startTime?: Date;
  endTime?: Date;
  roundTimeStamp?: number;
  roundPlayer?: number;
  startPlayer?: number;
  roundSum?: number;

  _createTime: Date;
  _updateTime: Date;
}
interface GameData extends GameBaseData {
  own: boolean;
  inGame: boolean;
  playerIndex: number;
  canJoin: boolean;
  inRound?: boolean;
}

declare namespace Yahtzee {
  interface YahtzeeGameBaseData extends GameBaseData {
    players: YahtzeePlayer[];
    winner?: number;
    chances?: number;
    diceList?: YahtzeeDiceData[];
  }
  interface YahtzeeGameData extends GameData, YahtzeeGameBaseData {
    roundScores?: Scores;
    otherScores?: Scores;
  }
  interface YahtzeePlayer extends Player {
    scores?: Scores;
  }
  interface YahtzeeDiceData {
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
}

declare namespace Martian {
  interface MartianPlayer extends Player {}
  interface MartianGameBaseData extends GameBaseData {
    players: MartianPlayer[];
    winners?: number[];
    round?: Round;
  }
  interface MartianGameData extends GameData, MartianGameBaseData {}
  interface MartianDiceData {
    value: number;
  }
  interface Round {
    roundTimeStamp: number;
    stage: number;
    diceList: MartianDiceData[];
    diceNum?: number;
    tankList?: MartianDiceData[];
    ufoList?: MartianDiceData[];
    awardList?: MartianDiceData[];
    roundScore?: number;
    ufoCanWin?: boolean;
    shouldRetreat?: boolean;
    canSelect?: boolean;
    cantSelectAnyUfo?: boolean;
    allToSelectIsUfo?: boolean;
    ufoWin?: boolean;
  }
}

declare namespace CantStop {
  type CantStopDiceData = number;
  interface CantStopGameBaseData extends GameBaseData {
    players: CantStopPlayer[];
    winner?: number;
    round?: Round;
  }
  interface CantStopGameData extends GameData, CantStopGameBaseData {}
  interface Round {
    roundTimeStamp: number;
    stage: number;
    diceList: CantStopDiceData[];
    roundProgress?: number[];
    roundRoad?: number[];
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
  interface SetGameBaseData extends GameBaseData {
    players: SetPlayer[];
    winners?: number[];
    gameCardList?: SetCardData[];
    reserveCardList?: SetCardData[];
    selectedCardList?: SetCardData[];
    timer?: boolean;
  }
  interface SetGameData extends GameData, SetGameBaseData {}
  interface SetPlayer extends Player {
    successSum?: number;
    failSum?: number;
  }
}

declare namespace Rummy {
  type rowColorMap = string[];
  interface Position {
    x: number;
    y: number;
  }
  interface RummyCardData {
    id: number;
    value: number;
    color: string;
    x?: number;
    y?: number;
    areaStatus?: number;
    inGround?: boolean;
    inGroundTemp?: boolean;
  }
  interface CrossData {
    rowIndex: number;
    colIndex: number;
  }
  interface RummyGameBaseData extends GameBaseData {
    players: RummyPlayer[];
    winner?: number;
    cardLibrary: RummyCardData[];
    playgroundData: RummyCardData[][];
    roundPlaygroundData: RummyCardData[][]; // 临时的 playgroundData
  }
  interface RummyGameData extends GameData, RummyGameBaseData {
    playgroundCardList: RummyCardData[];
    myCardList: RummyCardData[];
  }
  interface RummyPlayer extends Player {
    cardList?: RummyCardData[];
    icebreaking?: boolean;
  }
}
