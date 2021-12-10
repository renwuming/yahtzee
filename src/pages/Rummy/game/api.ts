import Taro from "@tarojs/taro";
import { RUMMY_AREA_STATUS, RUMMY_SET_TYPE } from "@/const";
import { shuffle } from "@/utils";

export const GROUND_COL_LEN = 8;
export const GROUND_ROW_LEN = 23;
export const BOARD_COL_LEN = 2;
export const BOARD_ROW_LEN = 18;
export const BOARD_SUM = BOARD_COL_LEN * BOARD_ROW_LEN;

export const sameValueIndexList = [
  161, 166, 138, 143, 115, 120, 92, 97, 69, 74, 46, 51, 23, 28, 0, 5,
];

export function getStraightIndexListByValue(value) {
  let colIndex = GROUND_COL_LEN - 1;
  const res = [];
  for (let i = colIndex; i >= 0; i--) {
    res.push(i * 23 + 9 + value);
  }
  return res;
}

const RUMMY_JOKERS = [
  { color: "red", value: 0 },
  { color: "black", value: 0 },
];
export const RUMMY_COLORS = ["red", "yellow", "blue", "black"];
export const RUMMY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const RUMMY_CARD_LIBRARY = [0, 1]
  .reduce((list) => {
    return list.concat(
      RUMMY_COLORS.reduce((list2, color) => {
        return list2.concat(
          RUMMY_VALUES.reduce((list3, value) => {
            return list3.concat({
              color,
              value,
            });
          }, [])
        );
      }, [])
    );
  }, [])
  // .concat(RUMMY_JOKERS)
  .map((item, id) => ({
    ...item,
    id,
  }));

export const INIT_PLAY_GROUND = () =>
  new Array(GROUND_COL_LEN).fill(1).map((_) => {
    return new Array(GROUND_ROW_LEN);
  });

export const INIT_PLAY_BOARD = () =>
  new Array(BOARD_COL_LEN).fill(1).map((_) => {
    return new Array(BOARD_ROW_LEN);
  });

export async function getGameData() {
  const initList = shuffle(RUMMY_CARD_LIBRARY);

  return {
    playgroundCardList: [],
    cardList: initList.slice(0, 14),
    cardLibrary: initList.slice(14),
  };
}

export function getNewCardPosOnBoard(playboardData) {
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

export function handleCardList(cardList, setList = []) {
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

export function getAreaPos(cross, areaStatus) {
  const { playgroundPosData, playboardPosData, cardW, cardH } =
    getRummyDeviceData();
  const inGround = areaStatus === RUMMY_AREA_STATUS.playground;
  const areaPos = inGround ? playgroundPosData : playboardPosData;
  const { rowIndex, colIndex } = cross;
  const boardExtraCol = inGround ? 0 : colIndex * 3;

  const { x, y } = areaPos;
  const _x = rowIndex * cardW + x;
  const _y = colIndex * cardH + y + boardExtraCol;
  return {
    x: _x,
    y: _y,
  };
}

export function getGroundCrossByIndex(index) {
  const rowIndex = index % GROUND_ROW_LEN;
  const colIndex = Math.floor(index / GROUND_ROW_LEN);
  return {
    rowIndex,
    colIndex,
  };
}

export function getCrossByCardPos(card) {
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
    colIndex: Math.floor((y - Y) / cardH),
    rowIndex: Math.floor((x - X) / cardW),
  };
}

export function getBoardCrossByIndex(index) {
  const rowIndex = index % BOARD_ROW_LEN;
  const colIndex = Math.floor(index / BOARD_ROW_LEN);
  return {
    rowIndex,
    colIndex,
  };
}

export function getGroundPosByIndex(index) {
  const { rowIndex, colIndex } = getGroundCrossByIndex(index);
  return getAreaPos(
    {
      rowIndex,
      colIndex,
    },
    RUMMY_AREA_STATUS.playground
  );
}
export function getBoardPosByIndex(index) {
  const { rowIndex, colIndex } = getBoardCrossByIndex(index);
  return getAreaPos(
    {
      rowIndex,
      colIndex,
    },
    RUMMY_AREA_STATUS.playboard
  );
}

export function judgeIn(pos, areaStatus) {
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

export function getBoxCross(pos, areaStatus) {
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
  const rowIndex = Math.floor((_x + cardW / 2) / cardW);
  const colIndex = Math.floor((_y + cardH / 2) / cardH);

  return {
    rowIndex,
    colIndex,
  };
}

const COLOR_VALUE_MAP = {
  red: 0,
  yellow: 1,
  blue: 2,
  black: 3,
};
export function cardSortStraightFn(a, b) {
  const { color, value } = a;
  const { color: color2, value: value2 } = b;
  if (color !== color2) {
    return COLOR_VALUE_MAP[color] - COLOR_VALUE_MAP[color2];
  } else {
    return value - value2;
  }
}
export function cardSortFn(a, b) {
  const { color, value } = a;
  const { color: color2, value: value2 } = b;
  if (value !== value2) {
    return value - value2;
  } else {
    return COLOR_VALUE_MAP[color] - COLOR_VALUE_MAP[color2];
  }
}

export function getCardIndexByID(list, id) {
  const L = list.length;
  for (let i = 0; i < L; i++) {
    const item = list[i];
    if (item.id === id) {
      return i;
    }
  }
  return -1;
}

export function sortCardList(cardList) {
  const setList = [];
  const IDMap = {};

  const inGroundCardList = cardList.filter(
    (item) => item.areaStatus === RUMMY_AREA_STATUS.playground
  );
  cardList = cardList
    .filter((item) => item.areaStatus !== RUMMY_AREA_STATUS.playground)
    .sort(cardSortFn);

  RUMMY_COLORS.forEach((color) => {
    const list = cardList.filter((item) => item.color === color);
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
          tempList[l - 1]?.value === item.value - 1
        ) {
          tempList.push(item);
        } else {
          if (tempList.length >= 3) {
            setList.push(tempList);
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
        setList.push(tempList);
        tempList.forEach(({ id }) => {
          IDMap[id] = true;
        });
      }
    }
  });

  RUMMY_VALUES.forEach((value) => {
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
        } else {
          if (tempList.length >= 3) {
            setList.push(tempList);
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
        setList.push(tempList);
        tempList.forEach(({ id }) => {
          IDMap[id] = true;
        });
      }
    }
  });

  const _cardList = cardList.filter(({ id }) => !IDMap[id]);

  const showCardList = handleCardList(_cardList, setList);

  return showCardList.concat(inGroundCardList);
}

export function judgeListIsSet(list): boolean {
  if (list.length < 3) return false;
  const colorN = new Set(list.map((item) => item.color)).size;
  const isStraight = colorN === 1;
  const isSameValue = colorN === list.length;
  if (isStraight) {
    const exp = new RegExp(list.map((item) => item.value).join("-"));
    return exp.test("1-2-3-4-5-6-7-8-9-10-11-12-13");
  } else if (isSameValue) {
    return new Set(list.map((item) => item.value)).size === 1;
  }
  return false;
}

export function tidyPlayground(
  playgroundData,
  cardList,
  setPlaygroundData,
  setCardList
) {
  const rowColorMap = [];
  let tempList = [];
  for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      // console.log(card, ">>>>>");
      // 中断 或者 新的一行
      if ((!card || j === 0) && tempList.length >= 3) {
        // console.log(i, j);
        handleSetToProperPos(
          tempList,
          playgroundData,
          cardList,
          setPlaygroundData,
          setCardList,
          rowColorMap
        );
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
}

function handleSetToProperPos(
  list,
  playgroundData,
  cardList,
  setPlaygroundData,
  setCardList,
  rowColorMap
) {
  // console.log("list", list, "handleSetToProperPos");
  const [card] = list;
  const type = judgeSetType(list);
  if (type === RUMMY_SET_TYPE.samevalue) {
    for (let i = 0; i < sameValueIndexList.length; i++) {
      const index = sameValueIndexList[i];
      const { rowIndex, colIndex } = getGroundCrossByIndex(index);
      const { x, y } = getAreaPos(
        { colIndex, rowIndex },
        RUMMY_AREA_STATUS.playground
      );

      const placeCard = playgroundData[colIndex][rowIndex];
      const hasPlace = !placeCard || getCardIndexByID(list, placeCard.id) >= 0;
      if (hasPlace) {
        // console.log(list, index);
        placeSetToGroundByIndex(
          list,
          index,
          playgroundData,
          cardList,
          setPlaygroundData,
          setCardList
        );
        break;
      }
    }
  } else {
    const L = list.length;
    const straightIndexList = getStraightIndexListByValue(card.value);
    for (let i = 0; i < straightIndexList.length; i++) {
      const index = straightIndexList[i];
      const { rowIndex, colIndex } = getGroundCrossByIndex(index);
      const { x, y } = getAreaPos(
        { colIndex, rowIndex },
        RUMMY_AREA_STATUS.playground
      );
      const hasPlace = new Array(L).fill(1).every((_, index) => {
        const card = playgroundData[colIndex][rowIndex + index];
        if (!card) return true;
        return getCardIndexByID(list, card.id) >= 0;
      });
      const rowColor = rowColorMap[colIndex];
      if (!rowColor) rowColorMap[colIndex] = card.color;
      const sameColor = !rowColor || card.color === rowColor;

      // console.log(rowColorMap, rowColor, sameColor, hasPlace);
      if (sameColor && hasPlace) {
        placeSetToGroundByIndex(
          list,
          index,
          playgroundData,
          cardList,
          setPlaygroundData,
          setCardList
        );
        break;
      }
    }
  }
}

export function placeSetToGroundByIndex(
  list,
  index,
  playgroundData,
  cardList,
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
  card,
  index,
  playgroundData,
  cardList,
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
  // console.log("colIndex,rowIndex", colIndex, rowIndex);
  playgroundData[colIndex][rowIndex] = card;

  const { x, y } = getAreaPos(
    { colIndex, rowIndex },
    RUMMY_AREA_STATUS.playground
  );
  const cardIndex = getCardIndexByID(cardList, id);

  cardList[cardIndex].x = x;
  cardList[cardIndex].y = y;
  cardList[cardIndex].areaStatus = RUMMY_AREA_STATUS.playground;
  setCardList(cardList.concat());
  setPlaygroundData(playgroundData);
}

function judgeSetType(list) {
  const colorN = new Set(list.map((item) => item.color)).size;
  const isStraight = colorN === 1;
  return isStraight ? RUMMY_SET_TYPE.straight : RUMMY_SET_TYPE.samevalue;
}

export function getRummyDeviceData() {
  return Taro.getStorageSync("rummy_device_data");
}

export function placeSetFromBoardToGround(
  playboardData,
  playgroundData,
  cardList,
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

function getRowColorMap(playgroundData) {
  const rowColorMap = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 10; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (card) {
        rowColorMap[i] = card.color;
        break;
      }
    }
  }
  return rowColorMap;
}

export function judgePlaygroundPerfect(playgroundData): boolean {
  let tempList = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      if (!card || j === 0) {
        if (tempList.length > 0) {
          const judgeRes = judgeListIsSet(tempList);
          if (!judgeRes) {
            return false;
          }
        }
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }

  return true;
}
