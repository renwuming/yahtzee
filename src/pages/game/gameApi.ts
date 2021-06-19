import Taro from "@tarojs/taro";
import { DEFAULT_SCORES } from "../../const";
import { CallCloudFunction } from "../../utils";

export async function getGameData(id: string): Promise<GameBaseData> {
  const data = await CallCloudFunction({
    name: "yahtzeeGetGame",
    data: {
      id,
    },
  });

  return data;
}

export function handleGameData(data: GameBaseData): GameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const { owner, players, roundPlayer, start } = data;

  const own = owner.openid === openid;
  const openids = players.map((item) => item.openid);
  const inGame = openids.includes(openid);
  const inRound = inGame && openids[roundPlayer] === openid;
  players.forEach((item, index) => {
    item.inRound = index === roundPlayer;
  });

  let roundScores = DEFAULT_SCORES;
  let otherScores = DEFAULT_SCORES;

  if (start) {
    roundScores = players[roundPlayer].scores;
    if (players.length > 1) {
      const nextRoundPlayer = (roundPlayer + 1) % players.length;
      otherScores = players[nextRoundPlayer].scores;
    }
  }
  return {
    ...data,
    own,
    inGame,
    inRound,
    roundScores,
    otherScores,
  };
}

function getWinner(players: Player[]): number {
  if (players.length <= 1) return null;
  const { sumScore: sum1 } = players[0];
  const { sumScore: sum2 } = players[1];
  if (sum1 === sum2) return -1;
  else if (sum1 > sum2) return 0;
  else return 1;
}

export async function startGame(id: string) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "startGame",
    },
  });
}

export async function joinGame(id: string) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "joinGame",
    },
  });
}

export async function leaveGame(id: string) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "leaveGame",
    },
  });
}

export async function updateGame(id: string, data) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "updateGame",
      data,
    },
  });
}

export async function updateGameScores(id: string, scores, lastScoreType) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "updateGameScores",
      data: {
        scores,
        lastScoreType,
      },
    },
  });
}
