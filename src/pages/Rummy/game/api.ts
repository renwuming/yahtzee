import Taro from "@tarojs/taro";
import {
  CARD_SUM,
  MAX_PLAYERS,
  RUMMY_AREA_STATUS,
  RUMMY_SET_TYPE,
} from "@/const";
import { CallCloudFunction, flat, navigateTo } from "@/utils";
import { ChatType, updateChatAction_Database } from "@/Components/Chat/api";

export const CARD_LIBRARY: number[] = new Array(CARD_SUM)
  .fill(1)
  .map((_, id) => id);

export async function increaseRoundTime(id, showToast, price) {
  const success = await handleGameAction(
    id,
    "increaseRoundTime",
    {},
    showToast
  );
  if (success) {
    const { openid, nickName } = Taro.getStorageSync("userInfo");
    const message = `${nickName} 延长了回合时间，花费 ${price} 金币`;
    updateChatAction_Database(openid, id, message, ChatType.system);
  }
}

export async function handleGameAction(
  id: string,
  action: string,
  data: any = {},
  showToast: any = () => {}
): Promise<boolean> {
  const res = await CallCloudFunction({
    name: "gameApi",
    data: {
      action: action,
      gameDbName: "rummy_games",
      id,
      data,
    },
  });
  if (res) {
    const { errCode, errMsg } = res;
    if (errCode === 400) {
      showToast(errMsg, 3000);
    }
    return false;
  }
  return true;
}

export async function createGame() {
  const { _id } = await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "create",
      gameDbName: "rummy_games",
    },
  });
  navigateTo("Rummy", `game/index?id=${_id}`);
}

export async function getGameData(
  id: string
): Promise<Rummy.RummyGameBaseData> {
  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "findOne",
      gameDbName: "rummy_games",
      id,
    },
  });
}

export function handleGameData(
  data: Rummy.RummyGameBaseData
): Rummy.RummyGameData {
  const { openid } = Taro.getStorageSync("userInfo");
  const {
    start,
    end,
    owner,
    players,
    playgroundData,
    roundPlayer,
    roundPlaygroundData,
  } = data;

  const own = owner.openid === openid;
  const canJoin = players.length < MAX_PLAYERS;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(openid);
  const inGame = playerIndex >= 0;
  const inRound = roundPlayer === playerIndex;

  let myCardList = [];
  let _playgroundData = playgroundData;
  let playgroundCardList = [];
  if (start) {
    players[roundPlayer].inRound = true;
    if (inGame) {
      const { cardList } = players[playerIndex];
      myCardList = handleCardList(cardList);
    }

    if (roundPlaygroundData && !inRound && !end) {
      _playgroundData = roundPlaygroundData;
    }
    const playgroundDataIDList = flat(playgroundData)
      .filter((e) => e)
      .map((card) => card.id);
    playgroundCardList = groundData2List(_playgroundData, playgroundDataIDList);
  }

  return {
    ...data,
    own,
    inGame,
    inRound,
    playerIndex,
    canJoin,
    playgroundData: _playgroundData,
    playgroundCardList,
    myCardList,
  };
}

function groundData2List(
  playgroundData: Rummy.RummyCardData[][],
  playgroundDataIDList: number[]
): Rummy.RummyCardData[] {
  const resList = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (card) {
        const pos = getAreaPos(
          {
            colIndex: i,
            rowIndex: j,
          },
          RUMMY_AREA_STATUS.playground
        );

        card.inGround = true;
        if (playgroundDataIDList.includes(card.id)) {
          card.inGroundTemp = false;
        } else {
          card.inGroundTemp = true;
        }
        resList.push(updateCardPos(card, pos));
      }
    }
  }
  return resList;
}

export const GROUND_COL_LEN: number = 14;
export const GROUND_ROW_LEN: number = 13;
export const BOARD_COL_LEN: number = 3;
export const BOARD_ROW_LEN: number = 12;
export const BOARD_SUM: number = BOARD_COL_LEN * BOARD_ROW_LEN;

const RUMMY_COLORS = ["black", "blue", "red", "yellow"];
const RUMMY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const sameValueIndexList: number[] = new Array(12).fill(1).map((_, index) => {
  if (index % 2 === 0) return (index / 2) * GROUND_ROW_LEN + 2;
  else return Math.ceil(index / 2) * GROUND_ROW_LEN - 6;
});

function getStraightIndexListByValue(value: number): number[] {
  let colIndex = GROUND_COL_LEN - 1;
  const res = [];
  for (let i = colIndex; i >= 0; i--) {
    res.push(i * GROUND_ROW_LEN + value - 1);
  }
  return res;
}
export function initPlayboard() {
  return new Array(BOARD_COL_LEN).fill(1).map((_) => {
    return new Array(BOARD_ROW_LEN);
  });
}

export function getNewCardPosOnBoard(
  playboardData: Rummy.RummyCardData[][]
): Rummy.Position {
  for (let i = BOARD_COL_LEN - 1; i >= 0; i--) {
    for (let j = BOARD_ROW_LEN - 1; j >= 0; j--) {
      const card = playboardData[i][j];
      if (!card)
        return getAreaPos(
          {
            colIndex: i,
            rowIndex: j,
          },
          RUMMY_AREA_STATUS.playboard
        );
    }
  }
}

export function getResetCardPosOnBoard(
  playboardData: Rummy.RummyCardData[][],
  L: number
): Rummy.Position[] {
  const resList = [];
  for (let i = 0; i < BOARD_COL_LEN; i++) {
    for (let j = 0; j < BOARD_ROW_LEN; j++) {
      const card = playboardData[i][j];
      if (!card) {
        const pos = getAreaPos(
          {
            colIndex: i,
            rowIndex: j,
          },
          RUMMY_AREA_STATUS.playboard
        );
        resList.push(pos);
        if (resList.length >= L) return resList;
      }
    }
  }
}

function handleCardList(
  cardList: Rummy.RummyCardData[],
  setList: Rummy.RummyCardData[][] = []
) {
  let resList = [];
  let setIndex = 0;
  setList.forEach((set) => {
    resList = resList.concat(
      set.map((card) => {
        const { x, y } = getBoardPosByIndex(setIndex);
        setIndex++;
        return {
          ...card,
          areaStatus: RUMMY_AREA_STATUS.playboard,
          x,
          y,
        };
      })
    );
    setIndex++;
  });

  const L = cardList.length;

  cardList = cardList.map((card, index) => {
    const { x, y } = getBoardPosByIndex(BOARD_SUM - L + index);
    return {
      ...card,
      areaStatus: RUMMY_AREA_STATUS.playboard,
      x,
      y,
    };
  });

  return resList.concat(cardList);
}

export function getAreaPos(
  cross: Rummy.CrossData,
  areaStatus: number
): Rummy.Position {
  const { playgroundPosData, playboardPosData, cardW, cardH } =
    getRummyDeviceData();
  const inGround = areaStatus === RUMMY_AREA_STATUS.playground;
  const areaPos = inGround ? playgroundPosData : playboardPosData;
  const { rowIndex, colIndex } = cross;
  const boardExtraCol = inGround ? 0 : colIndex * 1.5;

  const { x, y } = areaPos || {};
  const _x = rowIndex * cardW + x + 1;
  const _y = colIndex * cardH + y + boardExtraCol;
  return {
    x: _x,
    y: _y,
  };
}

function getGroundCrossByIndex(index: number): Rummy.CrossData {
  const rowIndex = index % GROUND_ROW_LEN;
  const colIndex = ~~(index / GROUND_ROW_LEN);
  return {
    rowIndex,
    colIndex,
  };
}

export function getCrossByCardPos(card: Rummy.RummyCardData): Rummy.CrossData {
  const { playgroundPosData, playboardPosData, cardW, cardH } =
    getRummyDeviceData();
  const { x, y, areaStatus } = card;
  let X, Y;
  if (areaStatus === RUMMY_AREA_STATUS.playground) {
    X = playgroundPosData.x;
    Y = playgroundPosData.y;
  } else if (areaStatus === RUMMY_AREA_STATUS.playboard) {
    X = playboardPosData.x;
    Y = playboardPosData.y;
  }
  return {
    colIndex: ~~((y - Y) / cardH),
    rowIndex: ~~((x - X) / cardW),
  };
}

function getBoardCrossByIndex(index: number): Rummy.CrossData {
  const rowIndex = index % BOARD_ROW_LEN;
  const colIndex = ~~(index / BOARD_ROW_LEN);
  return {
    rowIndex,
    colIndex,
  };
}

function getBoardPosByIndex(index: number): Rummy.Position {
  const { rowIndex, colIndex } = getBoardCrossByIndex(index);
  return getAreaPos(
    {
      rowIndex,
      colIndex,
    },
    RUMMY_AREA_STATUS.playboard
  );
}

export function judgeIn(pos: Rummy.Position, areaStatus: number): boolean {
  const { playgroundPosData, playboardPosData, cardW, cardH } =
    getRummyDeviceData();

  const { x: x1, y: y1 } = pos;
  let x, y, width, height;
  if (areaStatus === RUMMY_AREA_STATUS.playground) {
    x = playgroundPosData.x;
    y = playgroundPosData.y;
    width = playgroundPosData.width;
    height = playgroundPosData.height;
  } else if (areaStatus === RUMMY_AREA_STATUS.playboard) {
    x = playboardPosData.x;
    y = playboardPosData.y;
    width = playboardPosData.width;
    height = playboardPosData.height;
  }

  return (
    x1 > x - cardW / 2 &&
    x1 < x + width - cardW / 2 &&
    y1 > y - cardH / 2 &&
    y1 < y + height - cardH / 2
  );
}

export function getBoxCross(
  pos: Rummy.Position,
  areaStatus: number
): Rummy.CrossData {
  const { playgroundPosData, playboardPosData, cardW, cardH } =
    getRummyDeviceData();

  const { x: x1, y: y1 } = pos;
  let x, y;

  if (areaStatus === RUMMY_AREA_STATUS.playground) {
    x = playgroundPosData.x;
    y = playgroundPosData.y;
  } else if (areaStatus === RUMMY_AREA_STATUS.playboard) {
    x = playboardPosData.x;
    y = playboardPosData.y;
  }

  const _x = x1 - x;
  const _y = y1 - y;
  const rowIndex = ~~((_x + cardW / 2) / cardW);
  const colIndex = ~~((_y + cardH / 2) / cardH);

  return {
    rowIndex,
    colIndex,
  };
}

function cardSortStraightFn(
  a: Rummy.RummyCardData,
  b: Rummy.RummyCardData
): number {
  const { color, value } = a;
  const { color: color2, value: value2 } = b;
  if (color !== color2) {
    return color >= color2 ? 1 : -1;
  } else {
    return value - value2;
  }
}
function cardSortFn(a: Rummy.RummyCardData, b: Rummy.RummyCardData): number {
  const { color, value } = a;
  const { color: color2, value: value2 } = b;
  if (value !== value2) {
    return value - value2;
  } else {
    return color >= color2 ? 1 : -1;
  }
}

export function getCardIndexByID(
  list: Rummy.RummyCardData[],
  id: number
): number {
  const L = list.length;
  for (let i = 0; i < L; i++) {
    const item = list[i];
    if (item.id === id) {
      return i;
    }
  }
  return -1;
}

export function sortCardList(
  cardList: Rummy.RummyCardData[],
  straightSortFirst: boolean
): Rummy.RummyCardData[] {
  const setList = [];
  const IDMap = {};

  const inGroundCardList = cardList.filter(
    (item) => item.areaStatus === RUMMY_AREA_STATUS.playground
  );

  cardList = cardList.filter(
    (item) => item.areaStatus !== RUMMY_AREA_STATUS.playground
  );
  // 顺序不要变
  const jokerList = cardList.filter((item) => item.value === 0);
  cardList = cardList
    .filter((item) => item.value !== 0)
    .sort(straightSortFirst ? cardSortStraightFn : cardSortFn);

  if (straightSortFirst) {
    findStraightSet(cardList, jokerList, IDMap, setList);
    findGroupSet(cardList, jokerList, IDMap, setList);
  } else {
    findGroupSet(cardList, jokerList, IDMap, setList);
    findStraightSet(cardList, jokerList, IDMap, setList);
  }

  const _cardList = jokerList.concat(cardList.filter(({ id }) => !IDMap[id]));

  const showCardList = handleCardList(_cardList, setList);

  return showCardList.concat(inGroundCardList);
}

function findStraightSet(cardList, jokerList, IDMap, setList) {
  RUMMY_COLORS.forEach((color) => {
    const list = cardList.filter((item) => item.color === color).reverse();
    if (list.length === 0) return;
    let loopFlag = true;
    while (loopFlag) {
      let tempList = [];
      for (let i = 0; i < list.length; i++) {
        if (i === list.length - 1) {
          loopFlag = false;
        }
        const item = list[i];
        const l = tempList.length;
        if (IDMap[item.id] || tempList[l - 1]?.value === item.value) {
          continue;
        } else if (
          tempList.length === 0 ||
          tempList[l - 1]?.value === item.value + 1
        ) {
          tempList.push(item);
        } else if (
          jokerList.length > 0 &&
          tempList[l - 1]?.value === item.value + 2
        ) {
          const [joker] = jokerList.splice(0, 1);
          tempList.push(joker, item);
        } else {
          if (tempList.length >= 3) {
            setList.push(tempList.reverse());
            tempList.forEach(({ id }) => {
              IDMap[id] = true;
            });
            tempList = [];
            break;
          } else if (jokerList.length > 0 && tempList.length === 2) {
            const [joker] = jokerList.splice(0, 1);
            if (tempList[0].value === 13) {
              tempList.push(joker);
            } else {
              tempList.unshift(joker);
            }
            setList.push(tempList.reverse());
            tempList.forEach(({ id }) => {
              IDMap[id] = true;
            });
            tempList = [];
            break;
          }
          tempList = [item];
        }
      }
      if (tempList.length >= 3) {
        setList.push(tempList.reverse());
        tempList.forEach(({ id }) => {
          IDMap[id] = true;
        });
      } else if (jokerList.length > 0 && tempList.length === 2) {
        const [joker] = jokerList.splice(0, 1);
        if (tempList[0].value === 13) {
          tempList.push(joker);
        } else {
          tempList.unshift(joker);
        }
        setList.push(tempList.reverse());
        tempList.forEach(({ id }) => {
          IDMap[id] = true;
        });
      }
    }
  });
}

function findGroupSet(cardList, jokerList, IDMap, setList) {
  RUMMY_VALUES.concat()
    .reverse()
    .forEach((value) => {
      const list = cardList.filter((item) => item.value === value);
      if (list.length === 0) return;
      let loopFlag = true;
      while (loopFlag) {
        let tempList = [];
        for (let i = 0; i < list.length; i++) {
          if (i === list.length - 1) {
            loopFlag = false;
          }
          const item = list[i];
          const l = tempList.length;
          if (IDMap[item.id] || tempList[l - 1]?.color === item.color) {
            continue;
          } else if (
            tempList.length === 0 ||
            tempList[l - 1]?.color !== item.color
          ) {
            tempList.push(item);
          }
        }
        if (tempList.length >= 3) {
          setList.push(tempList);
          tempList.forEach(({ id }) => {
            IDMap[id] = true;
          });
        } else if (jokerList.length > 0 && tempList.length === 2) {
          const [joker] = jokerList.splice(0, 1);
          tempList.push(joker);
          setList.push(tempList);
          tempList.forEach(({ id }) => {
            IDMap[id] = true;
          });
        }
      }
    });
}

function judgeListIsSet(list) {
  if (list.length < 3) return false;
  const noJokerList = list.filter((item) => item.value !== 0);
  // 没有小丑，则自动排序
  if (noJokerList.length === list.length) {
    list.sort((a, b) => a.value - b.value);
  }
  // 两张鬼牌+一张普通牌，必定符合条件
  if (noJokerList.length === 1) return true;

  const colorN = new Set(noJokerList.map((item) => item.color)).size;
  const isStraight = colorN === 1;
  const isSameValue = colorN === noJokerList.length;

  if (isStraight) {
    const exp = new RegExp(
      list
        .map((item, index) => {
          if (item.value === 0) {
            if (list[index - 1] && list[index - 1].value)
              return list[index - 1].value + 1;
            if (list[index - 2] && list[index - 2].value)
              return list[index - 2].value + 2;
            if (list[index + 1] && list[index + 1].value)
              return list[index + 1].value - 1;
            if (list[index + 2] && list[index + 2].value)
              return list[index + 2].value - 2;
          } else return item.value;
        })
        .join("-")
    );
    return exp.test("1-2-3-4-5-6-7-8-9-10-11-12-13");
  } else if (isSameValue) {
    if (list.length > 4) return false;
    return new Set(noJokerList.map((item) => item.value)).size === 1;
  }
  return false;
}

function handleSetToProperPos(
  list: Rummy.RummyCardData[],
  playgroundData: Rummy.RummyCardData[][],
  cardList: Rummy.RummyCardData[],
  setPlaygroundData,
  setCardList,
  rowColorMap: Rummy.rowColorMap
) {
  const L = list.length;
  const type = judgeSetType(list);
  if (type === RUMMY_SET_TYPE.samevalue) {
    // 放到预设位置
    for (let i = 0; i < sameValueIndexList.length; i++) {
      const index = sameValueIndexList[i];
      if (index < 0) break;
      const { rowIndex, colIndex } = getGroundCrossByIndex(index);
      const hasPlace = new Array(L).fill(1).every((_, index) => {
        const card = playgroundData[colIndex][rowIndex + index];
        if (!card) return true;
        return getCardIndexByID(list, card.id) >= 0;
      });
      if (hasPlace) {
        placeSetToGroundByIndex(
          list,
          index,
          playgroundData,
          cardList,
          setPlaygroundData,
          setCardList
        );
        return;
      }
    }
    // 如果没有预设位置，则找一个空位即可
    const index = findGroundEmptyPlace(list, playgroundData);
    if (index >= 0) {
      placeSetToGroundByIndex(
        list,
        index,
        playgroundData,
        cardList,
        setPlaygroundData,
        setCardList
      );
    }
  } else {
    let firstCardValue, firstCardColor;
    list.forEach((card, index) => {
      if (card.value === 0) return;
      firstCardValue = card.value - index;
      firstCardColor = card.color;
    });
    const straightIndexList = getStraightIndexListByValue(firstCardValue);
    // 放到预设位置
    for (let i = 0; i < straightIndexList.length; i++) {
      const index = straightIndexList[i];
      const { rowIndex, colIndex } = getGroundCrossByIndex(index);
      const hasPlace = new Array(L).fill(1).every((_, index) => {
        const card = playgroundData[colIndex][rowIndex + index];
        if (!card) return true;
        return getCardIndexByID(list, card.id) >= 0;
      });
      const rowColor = rowColorMap[colIndex];
      if (!rowColor) rowColorMap[colIndex] = firstCardColor;
      const sameColor = !rowColor || firstCardColor === rowColor;

      if (sameColor && hasPlace) {
        placeSetToGroundByIndex(
          list,
          index,
          playgroundData,
          cardList,
          setPlaygroundData,
          setCardList
        );
        return;
      }
    }
    // 如果没有预设位置，则找一个空位即可
    const index = findGroundEmptyPlace(list, playgroundData);
    if (index >= 0) {
      placeSetToGroundByIndex(
        list,
        index,
        playgroundData,
        cardList,
        setPlaygroundData,
        setCardList
      );
    }
  }
}

function findGroundEmptyPlace(list, playgroundData) {
  const N = list.length;
  let l = 0;
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (j === 0) {
        l = 1;
      }
      if (!card || getCardIndexByID(list, card.id) >= 0) {
        l++;
        if (j === GROUND_ROW_LEN - 1) {
          j++;
          l++;
        }
      } else {
        l = 0;
      }
      if (l >= N + 2) {
        return i * GROUND_ROW_LEN + j - N;
      }
    }
  }

  return -1;
}

function placeSetToGroundByIndex(
  list: Rummy.RummyCardData[],
  index: number,
  playgroundData: Rummy.RummyCardData[][],
  cardList: Rummy.RummyCardData[],
  setPlaygroundData,
  setCardList
) {
  list.forEach((card, i) => {
    const _index = index + i;
    moveCardToGroundIndex(
      card,
      _index,
      playgroundData,
      cardList,
      setPlaygroundData,
      setCardList
    );
  });
}

function moveCardToGroundIndex(
  card: Rummy.RummyCardData,
  index: number,
  playgroundData: Rummy.RummyCardData[][],
  cardList: Rummy.RummyCardData[],
  setPlaygroundData,
  setCardList
) {
  const { colIndex, rowIndex } = getGroundCrossByIndex(index);
  const { id } = card;
  playgroundData.forEach((row, i) => {
    row.forEach((item, j) => {
      if (item && item.id === id) {
        playgroundData[i][j] = null;
      }
    });
  });
  playgroundData[colIndex][rowIndex] = card;

  const pos = getAreaPos({ colIndex, rowIndex }, RUMMY_AREA_STATUS.playground);
  const cardIndex = getCardIndexByID(cardList, id);
  const newCard = updateCardPos(cardList[cardIndex], pos);
  cardList[cardIndex] = newCard;
  cardList[cardIndex].areaStatus = RUMMY_AREA_STATUS.playground;
  setCardList(cardList.concat());
  setPlaygroundData(playgroundData);
}

function judgeSetType(list: Rummy.RummyCardData[]): number {
  const noJokerList = list.filter((item) => item.value !== 0);
  if (noJokerList.length === 1) return RUMMY_SET_TYPE.all;
  const colorN = new Set(noJokerList.map((item) => item.color)).size;
  const isStraight = colorN === 1;
  return isStraight ? RUMMY_SET_TYPE.straight : RUMMY_SET_TYPE.samevalue;
}

function getRummyDeviceData() {
  return Taro.getStorageSync("rummy_device_data");
}

export function placeSetFromBoardToGround(
  playboardData: Rummy.RummyCardData[][],
  playgroundData: Rummy.RummyCardData[][],
  cardList: Rummy.RummyCardData[],
  setPlaygroundData,
  setCardList
) {
  const rowColorMap = getRowColorMap(playgroundData);
  let tempList = [];
  for (let i = 0; i < BOARD_COL_LEN; i++) {
    for (let j = 0; j < BOARD_ROW_LEN; j++) {
      const card = playboardData[i][j];
      if (!card || j === 0) {
        if (tempList.length > 0) {
          const judgeRes = judgeListIsSet(tempList);
          if (judgeRes) {
            handleSetToProperPos(
              tempList,
              playgroundData,
              cardList,
              setPlaygroundData,
              setCardList,
              rowColorMap
            );
          }
        }
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
}

function getRowColorMap(
  playgroundData: Rummy.RummyCardData[][]
): Rummy.rowColorMap {
  const rowColorMap = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (card && card.value !== 0) {
        rowColorMap[i] = card.color;
        break;
      }
    }
  }
  return rowColorMap;
}

export function judgePlaygroundPerfect(
  playgroundData: Rummy.RummyCardData[][]
): Rummy.RummyCardData[] {
  let tempList = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (!card || j === 0) {
        if (tempList.length > 0) {
          const judgeRes = judgeListIsSet(tempList);
          if (!judgeRes) {
            return tempList;
          }
          tempList = [];
        }
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
  if (tempList.length > 0) {
    const judgeRes = judgeListIsSet(tempList);
    if (!judgeRes) {
      return tempList;
    }
    tempList = [];
  }

  return null;
}

export function updateCardPos(card, pos) {
  const { x, y } = pos;
  card.x = Number.isInteger(x) ? x + 0.1 : ~~x;
  card.y = Number.isInteger(y) ? y + 0.1 : ~~y;
  return card;
}

export function tidyPlayground(
  playgroundData,
  cardList,
  setPlaygroundData,
  setCardList
) {
  const rowColorMap = [];
  const straightList = [];
  const samevalueList = [];
  let tempList = [];
  // 筛选所有 straight
  for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      // 中断 或者 新的一行
      if (!card || j === 0) {
        tidyAddSet(straightList, tempList, true);
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
  if (tempList) {
    tidyAddSet(straightList, tempList, true);
    tempList = [];
  }

  // 筛选所有 samevalue
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      // 中断 或者 新的一行
      if (!card || j === 0) {
        tidyAddSet(samevalueList, tempList, false);
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
  if (tempList) {
    tidyAddSet(samevalueList, tempList, false);
    tempList = [];
  }
  // 重新整理
  const newPlayground = initPlayground();
  straightList.concat(samevalueList).forEach((list) => {
    handleSetToProperPos(
      list,
      newPlayground,
      cardList,
      setPlaygroundData,
      setCardList,
      rowColorMap
    );
  });
}

function tidyAddSet(list, set, isStraight) {
  const type = judgeSetType(set);
  if (isStraight && type === RUMMY_SET_TYPE.straight) {
    list.push(set);
  } else if (!isStraight && type !== RUMMY_SET_TYPE.straight) {
    list.push(set);
  }
}

function initPlayground() {
  return new Array(GROUND_COL_LEN).fill(1).map((_) => {
    return new Array(GROUND_ROW_LEN);
  });
}

export function getNearestEmptyCross(
  areaStatus: RUMMY_AREA_STATUS,
  crossData: Rummy.CrossData,
  cardID: number,
  cardDataMap: Rummy.RummyCardData[][]
): Rummy.CrossData {
  const targetIsPlayground = areaStatus === RUMMY_AREA_STATUS.playground;
  const maxH = targetIsPlayground ? GROUND_COL_LEN : BOARD_COL_LEN;
  const maxW = targetIsPlayground ? GROUND_ROW_LEN : BOARD_ROW_LEN;

  const { rowIndex, colIndex } = crossData;

  const rowOffsetList = [0, -1, 1];
  const colOffsetList = [0, -1, 1];

  for (let i = 0; i < colOffsetList.length; i++) {
    for (let j = 0; j < rowOffsetList.length; j++) {
      const _row = rowIndex + rowOffsetList[j];
      const _col = colIndex + colOffsetList[i];
      const placeCard = cardDataMap[_col]?.[_row];
      if (placeCard?.id === cardID) return null;
      if (_row >= 0 && _row < maxW && _col >= 0 && _col < maxH && !placeCard) {
        return {
          rowIndex: _row,
          colIndex: _col,
        };
      }
    }
  }

  return null;
}
