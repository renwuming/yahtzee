const cloud = require("wx-server-sdk");

const { updatePlayer, getPlayer, findOne, shuffle, flat } = require("./common");

const MAX_PLAYERS = 4;
const PLAYER_START_CARD_NUM = 14;
const GROUND_COL_LEN = 14;
const GROUND_ROW_LEN = 13;
const RUMMY_SET_TYPE = {
  straight: 1,
  samevalue: 2,
  all: 3,
};

const sameValueIndexList = new Array(12).fill(1).map((_, index) => {
  if (index % 2 === 0) return (index / 2) * GROUND_ROW_LEN + 2;
  else return Math.ceil(index / 2) * GROUND_ROW_LEN - 6;
});

function getStraightIndexListByValue(value) {
  let colIndex = GROUND_COL_LEN - 1;
  const res = [];
  for (let i = colIndex; i >= 0; i--) {
    res.push(i * GROUND_ROW_LEN + value - 1);
  }
  return res;
}

// color为z是为了排序时在最后
const RUMMY_JOKERS = [
  { color: "z", value: 0 },
  { color: "z", value: 0 },
];
const RUMMY_COLORS = ["black", "blue", "red", "yellow"];
const RUMMY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
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
  .concat(RUMMY_JOKERS)
  .map((item, id) => ({
    ...item,
    id,
  }));

function initPlayground() {
  return new Array(GROUND_COL_LEN).fill(1).map((_) => {
    return new Array(GROUND_ROW_LEN);
  });
}

function initCardLibrary() {
  return shuffle(RUMMY_CARD_LIBRARY);
}

exports.create = async function create(gameDbName) {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  // 先查询是否有未开始的游戏
  const [game] = await db
    .collection(gameDbName)
    .where({
      "owner.openid": OPENID,
      start: _.neq(true),
    })
    .limit(1)
    .get()
    .then((res) => res.data);

  if (game) return game;

  const player = await getPlayer(OPENID);

  const date = new Date();
  const res = await db.collection(gameDbName).add({
    data: {
      start: false,
      owner: player,
      players: [player],
      _createTime: date,
      _updateTime: date,
      cardLibrary: initCardLibrary(),
      playgroundData: initPlayground(),
    },
  });

  db.collection("game_events").add({
    data: {
      gameID: res._id,
    },
  });

  return res;
};

exports.handleGame = async function handleGame(
  id,
  action,
  data,
  gameDbName,
  openid
) {
  const db = cloud.database();
  // 先读旧数据
  const { _id, ...oldData } = await findOne(gameDbName, id);

  try {
    const newData = await handleUpdateData(
      action,
      oldData,
      data,
      id,
      gameDbName,
      openid
    );
    if (newData) {
      // 游戏结束，则更新所有玩家的成就
      if (newData.end) {
        updatePlayer(oldData.players, "rummy", newData.rankList);
      }

      const date = new Date();
      // 增量更新数据
      await db
        .collection(gameDbName)
        .doc(id)
        .update({
          data: {
            ...newData,
            _updateTime: date,
          },
        });
    }
    return null;
  } catch (err) {
    const [errCode, errMsg] = err.message.split("-");
    if (+errCode === 400) {
      return {
        errCode: +errCode,
        errMsg,
      };
    }
  }
};

async function handleUpdateData(action, oldData, data, id, gameDbName, openid) {
  const OPENID = openid || cloud.getWXContext().OPENID;
  const { owner, players, start, roundPlayer } = oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inGame = playerIndex >= 0;
  const inRound = roundPlayer === playerIndex;
  const own = OPENID === owner.openid;

  // 开始游戏
  if (action === "startGame" && own) {
    const { cardLibrary } = oldData;
    players.forEach((player) => {
      player.cardList = cardLibrary.splice(0, PLAYER_START_CARD_NUM);
      player.icebreaking = false;
    });
    const startIndex = Math.floor(Math.random() * players.length);
    const now = new Date();

    // 如果已经开始游戏，则忽略
    const { start } = await findOne(gameDbName, id);
    if (start) return null;

    return {
      startTime: now,
      start: true,
      players,
      cardLibrary,
      roundTimeStamp: now,
      roundPlayer: startIndex,
      startPlayer: startIndex,
      roundSum: 0,
      roundPlaygroundData: null,
    };
  }
  // 加入游戏
  else if (action === "joinGame" && !inGame && players.length < MAX_PLAYERS) {
    // 获取用户数据
    const player = await getPlayer(OPENID);

    players.push(player);
    return {
      players,
    };
  }
  // 踢出某人
  else if (action === "kickPlayer" && own && !start) {
    const { openid } = data;
    const newPlayers = players.filter((item) => item.openid !== openid);
    return {
      players: newPlayers,
    };
  }
  // 离开游戏
  else if (action === "leaveGame" && inGame && !start) {
    const newPlayers = players.filter((item) => item.openid !== OPENID);
    return {
      players: newPlayers,
    };
  }
  // 更新本回合的临时 playgroundData
  else if (action === "updateRoundPlaygroundData" && inRound) {
    const { playgroundData: roundPlaygroundData } = data;
    return {
      roundPlaygroundData,
    };
  }
  // 结束回合，不需要抽牌
  else if (action === "endRoundPerfect" && inRound) {
    const { playgroundData, roundSum } = oldData;
    const currentPlayer = players[playerIndex];
    const { playgroundData: newPlaygroundData } = data;
    const newData = handleEndRoundPerfect(
      playgroundData,
      newPlaygroundData,
      currentPlayer,
      playerIndex,
      players
    );

    const newRoundData = newRound(roundPlayer, players, roundSum);
    return { ...newData, ...newRoundData };
  }
  // 结束回合，并抽牌
  // 超时，通过定时器，结束回合，并抽牌
  else if (
    (action === "endRoundAddCard" && inRound) ||
    action === "endRoundByTimer"
  ) {
    const timeoutFlag = action === "endRoundByTimer";
    if (timeoutFlag) {
      const { roundPlayer } = data;
      if (roundPlayer !== oldData.roundPlayer) {
        return;
      }
    }
    const { cardLibrary, roundSum } = oldData;
    const { cardList } = players[roundPlayer];
    const [newCard] = cardLibrary.splice(0, 1);
    if (newCard) cardList.unshift(newCard);

    const newRoundData = newRound(roundPlayer, players, roundSum);
    const endData = handleEndData(players, cardLibrary, null);
    const timeoutData = handleTimeoutData(timeoutFlag, oldData);
    return {
      [`players.${roundPlayer}.cardList`]: cardList,
      cardLibrary,
      ...newRoundData,
      ...endData,
      ...timeoutData,
    };
  }

  return null;
}

function handleTimeoutData(timeoutFlag, gameData) {
  // 如果不是超时
  if (!timeoutFlag) return null;
  const { timeoutPlayers, roundPlayer, players } = gameData;
  const { timeStamp } = players[roundPlayer];
  const offline = Date.now() - timeStamp > 5000;
  // 如果玩家没有离线
  if (!offline) return null;

  // 如果超时且玩家离线，标记玩家，未来回合时间会缩短
  const newTimeoutPlayers = timeoutPlayers || [];
  if (!newTimeoutPlayers.includes(roundPlayer)) {
    newTimeoutPlayers.push(roundPlayer);
  }
  return { timeoutPlayers: newTimeoutPlayers };
}

function handleEndRoundPerfect(
  oldPlaygroundData,
  newPlaygroundData,
  currentPlayer,
  playerIndex,
  players
) {
  const isPerfect = judgePlaygroundPerfect(newPlaygroundData);
  if (!isPerfect) {
    throw new Error("400-出牌失败");
  }
  const oldPlaygroundDataIDList = flat(oldPlaygroundData)
    .filter((item) => item)
    .map((card) => card.id);
  const newPlaygroundDataList = flat(newPlaygroundData).filter((item) => item);
  const { cardList, icebreaking } = currentPlayer;
  const playerCardIDList = cardList.map((card) => card.id);
  const newPlaygroundDataIDList = newPlaygroundDataList.map((card) => card.id);

  const oldList = newPlaygroundDataList.filter((card) =>
    oldPlaygroundDataIDList.includes(card.id)
  );
  const newList = newPlaygroundDataList.filter(
    (card) => !oldPlaygroundDataIDList.includes(card.id)
  );
  const lastBoardList = newList.filter((card) =>
    playerCardIDList.includes(card.id)
  );

  if (newList.length === 0) {
    throw new Error("400-请出牌");
  }
  if (
    oldList.length !== oldPlaygroundDataIDList.length ||
    lastBoardList.length !== newList.length
  ) {
    throw new Error("400-禁止作弊");
  }
  // 如果未破冰，则必须总合>=30，并且不能使用公共牌
  if (!icebreaking) {
    const newSetList = selectNewListFromPlayground(
      newPlaygroundData,
      oldPlaygroundDataIDList
    );
    const allSet = newSetList.every((list) => judgeListIsSet(list));
    const newListValueSum = newSetList.reduce(
      (sum, set) => sum + getListValueSum(set),
      0
    );
    if (!allSet || newListValueSum < 30) {
      throw new Error(
        "400-破冰失败。第一次出牌要求点数之和不小于30，且不能与公共牌进行组合。"
      );
    }
  }
  // 整理playgroundData
  newPlaygroundData = tidyPlayground(newPlaygroundData);

  const newCardList = cardList.filter(
    (card) => !newPlaygroundDataIDList.includes(card.id)
  );

  // 判断回合结束
  players[playerIndex].cardList = newCardList;
  const endData = handleEndData(players, null, newCardList);

  return {
    playgroundData: newPlaygroundData,
    [`players.${playerIndex}.icebreaking`]: true,
    [`players.${playerIndex}.cardList`]: newCardList,
    ...endData,
  };
}

function newRound(roundPlayer, players, roundSum) {
  const newRoundPlayer = (roundPlayer + 1) % players.length;

  const updateData = {
    roundPlayer: newRoundPlayer,
    roundTimeStamp: new Date(),
    roundSum: roundSum + 1,
    roundPlaygroundData: null,
  };

  return updateData;
}

function handleEndData(players, cardLibrary, cardList) {
  // 小丑价值30
  const JokerValue = 30;
  if (
    (cardLibrary && cardLibrary.length === 0) ||
    (cardList && cardList.length === 0)
  ) {
    const handValueSumList = players.map((player, index) => {
      const { cardList } = player;
      const valueSum = cardList.reduce((sum, card) => {
        const value = card.value === 0 ? JokerValue : card.value;
        return sum + value;
      }, 0);
      return {
        value: valueSum,
        sum: cardList.length,
        index,
      };
    });

    const rankList = handValueSumList
      .sort((a, b) => {
        const { value, sum } = a;
        const { value: value2, sum: sum2 } = b;
        if (value === value2) return sum - sum2;
        else return value - value2;
      })
      .map((item) => item.index);

    return {
      end: true,
      endTime: new Date(),
      winner: rankList[0],
      rankList,
    };
  }

  return null;
}

function tidyPlayground(playgroundData) {
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
  straightList.sort((a, b) => {
    let colorA, colorB;
    for (let i = 0; i < a.length; i++) {
      const item = a[i];
      if (item.value !== 0) {
        colorA = item.color;
      }
    }
    for (let i = 0; i < b.length; i++) {
      const item = b[i];
      if (item.value !== 0) {
        colorB = item.color;
      }
    }
    return colorA >= colorB ? 1 : -1;
  });
  samevalueList.sort((a, b) => b[0].value - a[0].value);
  const newPlayground = initPlayground();
  straightList.concat(samevalueList).forEach((list) => {
    handleSetToProperPos(list, newPlayground, rowColorMap);
  });
  return newPlayground;
}

function tidyAddSet(list, set, isStraight) {
  const isSet = judgeListIsSet(set);
  if (!isSet) return;
  const type = judgeSetType(set);
  if (isStraight && type === RUMMY_SET_TYPE.straight) {
    list.push(set);
  } else if (!isStraight && type !== RUMMY_SET_TYPE.straight) {
    // 按照颜色排列
    set.sort((a, b) => (a.color >= b.color ? 1 : -1));
    list.push(set);
  }
}

function handleSetToProperPos(list, playgroundData, rowColorMap) {
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
        placeSetToGroundByIndex(list, index, playgroundData);
        return;
      }
    }
    // 如果没有预设位置，则找一个空位即可
    const index = findGroundEmptyPlace(list, playgroundData);
    if (index >= 0) {
      placeSetToGroundByIndex(list, index, playgroundData);
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
        placeSetToGroundByIndex(list, index, playgroundData);
        return;
      }
    }
    // 如果没有预设位置，则找一个空位即可
    const index = findGroundEmptyPlace(list, playgroundData);
    if (index >= 0) {
      placeSetToGroundByIndex(list, index, playgroundData);
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

function placeSetToGroundByIndex(list, index, playgroundData) {
  list.forEach((card, i) => {
    const _index = index + i;
    moveCardToGroundIndex(card, _index, playgroundData);
  });
}

function moveCardToGroundIndex(card, index, playgroundData) {
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
}

function judgeSetType(list) {
  const noJokerList = list.filter((item) => item.value !== 0);
  if (noJokerList.length === 1) return RUMMY_SET_TYPE.all;
  const colorN = new Set(noJokerList.map((item) => item.color)).size;
  const isStraight = colorN === 1;
  return isStraight ? RUMMY_SET_TYPE.straight : RUMMY_SET_TYPE.samevalue;
}
function getGroundCrossByIndex(index) {
  const rowIndex = index % GROUND_ROW_LEN;
  const colIndex = Math.floor(index / GROUND_ROW_LEN);
  return {
    rowIndex,
    colIndex,
  };
}
function getCardIndexByID(list, id) {
  const L = list.length;
  for (let i = 0; i < L; i++) {
    const item = list[i];
    if (item.id === id) {
      return i;
    }
  }
  return -1;
}

function selectNewListFromPlayground(
  newPlaygroundData,
  oldPlaygroundDataIDList
) {
  const resList = [];
  let tempList = [];
  for (let i = 0; i < GROUND_COL_LEN; i++) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      let card = newPlaygroundData[i][j];
      // 剔除之前公共区存在的card
      if (card && oldPlaygroundDataIDList.includes(card.id)) {
        card = null;
      }
      if (!card || j === 0) {
        if (tempList.length > 0) {
          resList.push(tempList);
          tempList = [];
        }
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
  if (tempList.length > 0) {
    resList.push(tempList);
    tempList = [];
  }

  return resList;
}

function judgePlaygroundPerfect(playgroundData) {
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
      return false;
    }
    tempList = [];
  }
  return true;
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
        const needJokers = tempList[l - 1]
          ? tempList[l - 1].value - item.value - 1
          : Infinity;
        if (IDMap[item.id] || (tempList[l - 1] || {}).value === item.value) {
          continue;
        } else if (
          tempList.length === 0 ||
          (tempList[l - 1] || {}).value === item.value + 1
        ) {
          tempList.push(item);
        } else if (jokerList.length >= needJokers) {
          const jokers = jokerList.splice(0, needJokers);
          tempList.push(...jokers, item);
        } else {
          if (tempList.length >= 3) {
            setList.push(tempList.reverse());
            tempList.forEach(({ id }) => {
              IDMap[id] = true;
            });
            tempList = [];
            break;
          } else {
            const needJokers = 3 - tempList.length;
            if (jokerList.length >= needJokers) {
              const jokers = jokerList.splice(0, needJokers);
              if (tempList[0].value === 13) {
                tempList.push(...jokers);
              } else {
                tempList.unshift(...jokers);
              }
              setList.push(tempList.reverse());
              tempList.forEach(({ id }) => {
                IDMap[id] = true;
              });
              tempList = [];
              break;
            }
          }
          tempList = [item];
        }
      }
      if (tempList.length >= 3) {
        setList.push(tempList.reverse());
        tempList.forEach(({ id }) => {
          IDMap[id] = true;
        });
      } else {
        const needJokers = 3 - tempList.length;
        if (jokerList.length >= needJokers) {
          const jokers = jokerList.splice(0, needJokers);
          if (tempList[0].value === 13) {
            tempList.push(...jokers);
          } else {
            tempList.unshift(...jokers);
          }
          setList.push(tempList.reverse());
          tempList.forEach(({ id }) => {
            IDMap[id] = true;
          });
        }
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
          if (IDMap[item.id] || (tempList[l - 1] || {}).color === item.color) {
            continue;
          } else if (
            tempList.length === 0 ||
            (tempList[l - 1] || {}).color !== item.color
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
  const IDMap = {};
  const setList = [];
  const jokerList = list.filter((item) => item.value === 0);
  const noJokerList = list.filter((item) => item.value !== 0);
  noJokerList.sort((a, b) => a.value - b.value);
  const isGroup = judgeSetType(noJokerList) === RUMMY_SET_TYPE.samevalue;

  if (isGroup) {
    // 群组长度不能大于4
    if (list.length > 4) return false;
    findGroupSet(noJokerList, jokerList, IDMap, setList);
  } else {
    findStraightSet(noJokerList, jokerList, IDMap, setList);
  }

  const extraList = list.filter(({ id }) => !IDMap[id]);

  const isSet =
    setList.length === 1 && extraList.every(({ value }) => value === 0);

  if (isSet) {
    const [resultList] = setList;
    if (extraList.length >= 1) {
      if (isGroup) {
        resultList.push(...extraList);
      } else {
        const tail = resultList[resultList.length - 1];
        if (tail.value === 13) {
          resultList.unshift(...extraList);
        } else if (tail.value === 12) {
          if (extraList.length === 1) {
            resultList.push(...extraList);
          } else {
            resultList.push(extraList[0]);
            resultList.unshift(...extraList.slice(1));
          }
        } else {
          resultList.push(...extraList);
        }
      }
    }
    for (let i = 0; i < list.length; i++) {
      list[i] = resultList[i];
    }
  }
  return isSet;
}

function getListValueSum(list) {
  let sum = 0;
  const L = list.length;
  for (let i = 0; i < L; i++) {
    const { value } = list[i];
    if (value !== 0) {
      sum += value;
    } else {
      const type = judgeSetType(list);
      const isStraight = type === RUMMY_SET_TYPE.straight;
      const isAll = type === RUMMY_SET_TYPE.all;
      let v;
      // 若是两张鬼牌+一张普通牌
      if (isAll) {
        let noJokerIndex = 0;
        list.forEach((card, index) => {
          if (card.value !== 0) {
            noJokerIndex = index;
          }
        });
        const { value } = list[noJokerIndex];
        // 普通牌在第一个
        if (noJokerIndex === 0) {
          if (value <= 11) return (value + 1) * 3;
        }
        // 其余情况
        return value * 3;
      } else if (isStraight) {
        if (list[i - 1] && list[i - 1].value) v = list[i - 1].value + 1;
        else if (list[i - 2] && list[i - 2].value) v = list[i - 2].value + 2;
        else if (list[i + 1] && list[i + 1].value) v = list[i + 1].value - 1;
        else if (list[i + 2] && list[i + 2].value) v = list[i + 2].value - 2;
      } else {
        if (list[i - 1] && list[i - 1].value) v = list[i - 1].value;
        else if (list[i - 2] && list[i - 2].value) v = list[i - 2].value;
        else if (list[i + 1] && list[i + 1].value) v = list[i + 1].value;
        else if (list[i + 2] && list[i + 2].value) v = list[i + 2].value;
      }
      sum += v;
    }
  }
  return sum;
}

exports.getRanking = async function getRanking(data) {
  const db = cloud.database();
  const _ = db.command;
  const { type, skip, pageLength } = data;

  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  if (type === "round") {
    const list = await db
      .collection("players")
      .where({
        "achievement.rummy.minRoundSum": _.exists(1),
        "achievement.rummy.minRoundSum": _.neq(null),
      })
      .orderBy("achievement.rummy.minRoundSum", "asc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        achievement: 1,
        openid: 1,
      })
      .skip(_skip)
      .limit(_pageLength)
      .get()
      .then((res) => res.data);

    return list;
  } else if (type === "sum") {
    const list = await db
      .collection("players")
      .where({
        "achievement.rummy.multiWinSum": _.exists(1),
      })
      .orderBy("achievement.rummy.multiWinSum", "desc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        achievement: 1,
        openid: 1,
      })
      .skip(_skip)
      .limit(_pageLength)
      .get()
      .then((res) => res.data);

    return list;
  } else if (type === "cardSum") {
    const list = await db
      .collection("players")
      .where({
        "achievement.rummy.minGroundCardSum": _.exists(1),
        "achievement.rummy.minGroundCardSum": _.neq(null),
      })
      .orderBy("achievement.rummy.minGroundCardSum", "asc")
      .field({
        avatarUrl: 1,
        nickName: 1,
        achievement: 1,
        openid: 1,
      })
      .skip(_skip)
      .limit(_pageLength)
      .get()
      .then((res) => res.data);

    return list;
  }

  return [];
};
