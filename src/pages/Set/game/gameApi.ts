import Taro from "@tarojs/taro";
import { MAX_PLAYERS } from "@/const";
import { CallCloudFunction, navigateTo, shuffle } from "@/utils";

export async function getGameData(id: string): Promise<Set.SetGameBaseData> {
  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "findOne",
      gameDbName: "set_games",
      id,
    },
  });
}

export async function handleGameAction(
  id: string,
  action: string,
  data: any = {}
) {
  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: action,
      gameDbName: "set_games",
      id,
      data,
    },
  });
}

export async function submitSetCloud(id: string, list: Set.SetCardData[]) {
  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "submitSet",
      gameDbName: "set_games",
      id,
      data: {
        list,
      },
    },
  });
}

export function handleGameData(data: Set.SetGameBaseData): Set.SetGameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const { owner, players, startTime } = data;

  players.forEach((item) => {
    item.inRound = true;
  });

  const own = owner.openid === openid;
  const canJoin = players.length < MAX_PLAYERS;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const inGame = playerIndex >= 0;

  return {
    ...data,
    own,
    inGame,
    playerIndex,
    canJoin,
    startTime: startTime ? new Date(startTime) : new Date(),
  };
}

export async function createGame() {
  const { _id } = await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "create",
      gameDbName: "set_games",
    },
  });
  navigateTo("Set", `game/index?id=${_id}`);
}

const COLORS = ["red", "green", "purple"];
const SHAPES = ["diamond", "rect", "S"];
const FILLS = ["empty", "solid", "line"];
const AMOUNTS = [1, 2, 3];
export const CARD_LIST = COLORS.reduce((list, color) => {
  return list.concat(
    SHAPES.reduce((list2, shape) => {
      return list2.concat(
        FILLS.reduce((list3, fill) => {
          return list3.concat(
            AMOUNTS.reduce((list4, n) => {
              return list4.concat({
                color,
                shape,
                fill,
                n,
              });
            }, [])
          );
        }, [])
      );
    }, [])
  );
}, []);

export function initCardList() {
  let initList = [];
  let continueFlag = true;
  while (continueFlag) {
    initList = shuffle(CARD_LIST);
    if (judgeSetExists(initList.slice(0, 12))) {
      continueFlag = false;
    }
  }
  return initList;
}

export function judgeSetExists(
  list: Set.SetCardData[] = []
): boolean | Set.SetCardData[] {
  const L = list.length;
  for (let i = 0; i < L; i++)
    for (let j = i + 1; j < L; j++)
      for (let k = j + 1; k < L; k++) {
        const judgeList = [list[i], list[j], list[k]];
        if (judgeSet(judgeList)) return judgeList;
      }

  return false;
}

export function judgeSet(list: Set.SetCardData[]): boolean {
  const colorKinds = getKinds(list, "color");
  if (colorKinds !== 1 && colorKinds !== 3) {
    return false;
  }
  const shapeKinds = getKinds(list, "shape");
  if (shapeKinds !== 1 && shapeKinds !== 3) {
    return false;
  }
  const fillKinds = getKinds(list, "fill");
  if (fillKinds !== 1 && fillKinds !== 3) {
    return false;
  }
  const nKinds = getKinds(list, "n");
  if (nKinds !== 1 && nKinds !== 3) {
    return false;
  }
  return true;
}

function getKinds(list: Set.SetCardData[], key: string): number {
  if (list.some((item) => !item.color)) return 0;
  return Array.from(new Set(list.map((item) => item[key]))).length;
}

export function inList(list, item) {
  return list.map((item) => item.index).includes(item.index);
}

export function getIndexof(list, item) {
  return list.map((item) => item.index).indexOf(item.index);
}
