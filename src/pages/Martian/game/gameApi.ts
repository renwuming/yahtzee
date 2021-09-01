import Taro from "@tarojs/taro";
import { MartianStage } from "../../../const";
import { CallCloudFunction, DB, navigateTo } from "../../../utils";

export async function getGameData(id: string): Promise<Martian.GameBaseData> {
  const data = await CallCloudFunction({
    name: "martianGetGame",
    data: {
      id,
    },
  });

  return data;
}

export async function createGame() {
  const { _id } = await CallCloudFunction({
    name: "martianCreateGame",
  });
  navigateTo("Martian", `game/index?id=${_id}`);
}

export async function startGame(id: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "startGame",
    },
  });
}

export function handleGameData(data: Martian.GameBaseData): Martian.GameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const { owner, players, roundPlayer, round } = data;

  const own = owner.openid === openid;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const inGame = playerIndex >= 0;
  const inRound = inGame && openids[roundPlayer] === openid;
  players.forEach((item, index) => {
    item.inRound = index === roundPlayer;
  });

  return {
    ...data,
    round: handleRound(round),
    own,
    inGame,
    inRound,
    playerIndex,
  };
}

export function watchDataBase(id: string, onChange) {
  const watcher = DB.collection("martian_games")
    .doc(id)
    /* @ts-ignore */
    .watch({
      onChange(data: any) {
        const { docs, docChanges } = data;
        const updatedFields = docChanges?.[0]?.updatedFields || {};
        onChange.current(docs[0], Object.keys(updatedFields));
      },
      onError(err) {
        console.error(err);
      },
    });

  return watcher;
}

export async function diceIt(id: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "dice",
    },
  });
}

export async function selectDice(id: string, value: number) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "select",
      data: {
        value,
      },
    },
  });
}

export async function endRound(id: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "endRound",
    },
  });
}

function handleRound(round: Martian.Round): Martian.Round {
  if (!round) return null;
  const { stage, diceNum, diceList, tankList, ufoList, awardList } = round;

  const needUfoNum = tankList.length - ufoList.length;
  const ufoCanWin = diceNum >= needUfoNum;
  const awardKindsNum = getKindsNum(awardList);
  const ufoWin = ufoList.length >= tankList.length;
  const shouldRetreat = awardKindsNum === 3 && ufoWin;
  const canSelect =
    judgeSelect(diceList, awardList) && stage === MartianStage.Select;
  const roundScore = calculateScore(round);

  return {
    ...round,
    ufoCanWin,
    shouldRetreat,
    canSelect,
    roundScore,
  };
}

function calculateScore(round: Martian.Round): number {
  const { tankList, ufoList, awardList } = round;
  if (tankList.length > ufoList.length) return 0;
  const basicScores = awardList.length;
  const bonus = getKindsNum(awardList) >= 3 ? 3 : 0;
  return basicScores + bonus;
}

function judgeSelect(
  diceList: Martian.DiceData[],
  awardList: Martian.DiceData[]
): boolean {
  const awardValueList = awardList.map((item) => item.value);

  return (
    diceList.filter(({ value }) => !awardValueList.includes(value)).length > 0
  );
}

function getKindsNum(list: Martian.DiceData[]): number {
  return Array.from(new Set(list.map((item) => item.value))).length;
}

export async function joinGame(id: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "joinGame",
    },
  });
}

export async function leaveGame(id: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "leaveGame",
    },
  });
}

export async function kickFromGame(id: string, openid: string) {
  await CallCloudFunction({
    name: "martianUpdateGame",
    data: {
      id,
      action: "kickPlayer",
      data: {
        openid,
      },
    },
  });
}


export async function updatePlayerOnline_Database(game: Martian.GameData) {
  if (!game) return;
  const { _id, playerIndex, inGame } = game;
  if (!inGame) return;
  const date = new Date();
  const timeStamp = Date.now();
  DB.collection("martian_games")
    .doc(_id)
    .update({
      data: {
        [`players.${playerIndex}.timeStamp`]: timeStamp,
        _updateTime: date,
      },
    });
}

