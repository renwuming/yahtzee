import Taro from "@tarojs/taro";
import { DEFAULT_SCORES } from "../../../const";
import { CallCloudFunction, DB, navigateTo } from "../../../utils";

export async function getGameData(
  id: string
): Promise<Yahtzee.YahtzeeGameBaseData> {
  const data = await CallCloudFunction({
    name: "yahtzeeGetGame",
    data: {
      id,
    },
  });

  return data;
}

export function handleGameData(
  data: Yahtzee.YahtzeeGameBaseData
): Yahtzee.YahtzeeGameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const { owner, players, roundPlayer, start } = data;

  const own = owner.openid === openid;
  const canJoin = players.length <= 1;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const inGame = playerIndex >= 0;
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
    canJoin,
    inGame,
    inRound,
    roundScores,
    otherScores,
    playerIndex,
  };
}

export async function createGame() {
  const { _id } = await CallCloudFunction({
    name: "yahtzeeCreateGame",
  });
  navigateTo("Yahtzee", `game/index?id=${_id}`);
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

export async function kickFromGame(id: string, openid: string) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "kickPlayer",
      data: {
        openid,
      },
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

export async function changeFreezeDice(id: string, data) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "freezeDice",
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

export async function updatePlayerOnline(id: string) {
  await CallCloudFunction({
    name: "yahtzeeUpdateGame",
    data: {
      id,
      action: "updatePlayerOnline",
    },
  });
}

export async function updatePlayerOnline_Database(game: GameData) {
  if (!game) return;
  const { _id, playerIndex, inGame } = game;
  if (!inGame) return;
  const date = new Date();
  const timeStamp = Date.now();
  DB.collection("yahtzee_games")
    .doc(_id)
    .update({
      data: {
        [`players.${playerIndex}.timeStamp`]: timeStamp,
        _updateTime: date,
      },
    });
}
