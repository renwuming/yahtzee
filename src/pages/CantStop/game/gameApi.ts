import Taro from "@tarojs/taro";
import { MAX_PLAYERS } from "../../../const";
import { CallCloudFunction, DB, navigateTo } from "../../../utils";

export async function getGameData(
  id: string
): Promise<CantStop.CantStopGameBaseData> {
  const data = await CallCloudFunction({
    name: "cantstopGetGame",
    data: {
      id,
    },
  });

  return data;
}

export async function createGame() {
  const { _id } = await CallCloudFunction({
    name: "cantstopCreateGame",
  });
  navigateTo("CantStop", `game/index?id=${_id}`);
}

export async function startGame(id: string) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "startGame",
    },
  });
}

export function handleGameData(
  data: CantStop.CantStopGameBaseData
): CantStop.CantStopGameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const { owner, players, roundPlayer } = data;

  const own = owner.openid === openid;
  const canJoin = players.length < MAX_PLAYERS;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const inGame = playerIndex >= 0;
  const inRound = inGame && openids[roundPlayer] === openid;
  players.forEach((item, index) => {
    item.inRound = index === roundPlayer;
  });

  return {
    ...data,
    own,
    inGame,
    inRound,
    playerIndex,
    canJoin,
  };
}

export function watchDataBase(id: string, onChange) {
  const watcher = DB.collection("cantstop_games")
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
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "dice",
    },
  });
}

export async function updateProgress(id: string, list: number[]) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "updateProgress",
      data: {
        list,
      },
    },
  });
}

export async function endRound(id: string) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "endRound",
    },
  });
}

export async function joinGame(id: string) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "joinGame",
    },
  });
}

export async function leaveGame(id: string) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "leaveGame",
    },
  });
}

export async function kickFromGame(id: string, openid: string) {
  await CallCloudFunction({
    name: "cantstopUpdateGame",
    data: {
      id,
      action: "kickPlayer",
      data: {
        openid,
      },
    },
  });
}

export async function updatePlayerOnline_Database(
  game: CantStop.CantStopGameData
) {
  if (!game) return;
  const { _id, playerIndex, inGame } = game;
  if (!inGame) return;
  const date = new Date();
  const timeStamp = Date.now();
  DB.collection("cantstop_games")
    .doc(_id)
    .update({
      data: {
        [`players.${playerIndex}.timeStamp`]: timeStamp,
        _updateTime: date,
      },
    });
}
