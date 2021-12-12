const cloud = require("wx-server-sdk");

const { updatePlayer, getPlayer, findOne, shuffle, flat } = require("./common");

const PLAYER_START_CARD_NUM = 14;
const GROUND_COL_LEN = 16;
const GROUND_ROW_LEN = 13;
const RUMMY_SET_TYPE = {
  straight: 1,
  samevalue: 2,
};

const sameValueIndexList = new Array(16).fill(1).map((_, index) => {
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

const RUMMY_JOKERS = [
  { color: "red", value: 0 },
  { color: "black", value: 0 },
];
const RUMMY_COLORS = ["red", "yellow", "blue", "black"];
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

  const newData = await handleUpdateData(
    action,
    oldData,
    data,
    id,
    gameDbName,
    openid
  );

  if (newData) {
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
};

async function handleUpdateData(action, oldData, data, id, gameDbName, openid) {
  const db = cloud.database();
  const _ = db.command;
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
    });
    const startIndex = Math.floor(Math.random() * players.length);
    const now = new Date();
    return {
      startTime: now,
      start: true,
      players,
      cardLibrary,
      roundTimeStamp: now,
      roundPlayer: startIndex,
      startPlayer: startIndex,
      roundSum: 0,
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
  // 结束回合，不需要抽牌
  else if (action === "endRoundPerfect" && inRound) {
    const { playgroundData, roundSum } = oldData;
    const currentPlayer = players[playerIndex];
    const { playgroundData: newPlaygroundData } = data;
    const newData = handleEndRoundPerfect(
      playgroundData,
      newPlaygroundData,
      currentPlayer,
      playerIndex
    );
    if (!newData) return null;

    const newRoundData = newRound(roundPlayer, players, roundSum);
    return { ...newData, ...newRoundData };
  }
  // 结束回合，并抽牌
  else if (action === "endRoundAddCard" && inRound) {
    const { cardLibrary, roundSum } = oldData;
    const { cardList } = players[playerIndex];
    const [newCard] = cardLibrary.splice(0, 1);
    if (newCard) cardList.unshift(newCard);

    const newRoundData = newRound(roundPlayer, players, roundSum);
    return {
      [`players.${playerIndex}.cardList`]: cardList,
      cardLibrary,
      ...newRoundData,
    };
  }

  // else if (action === "endByTimer") {
  //   const endData = handleEndData(players);
  //   return endData;
  // }

  return null;
}

function handleEndRoundPerfect(
  oldPlaygroundData,
  newPlaygroundData,
  currentPlayer,
  playerIndex
) {
  oldPlaygroundDataIDList = flat(oldPlaygroundData)
    .filter((item) => item)
    .map((card) => card.id);
  newPlaygroundDataList = flat(newPlaygroundData).filter((item) => item);
  const { cardList } = currentPlayer;
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

  if (newList.length === 0) return null;
  if (oldList.length !== oldPlaygroundDataIDList.length) return null;
  if (lastBoardList.length !== newList.length) return null;
  // 整理playgroundData
  tidyPlayground(newPlaygroundData);

  const newCardList = cardList.filter(
    (card) => !newPlaygroundDataIDList.includes(card.id)
  );

  // 判断回合结束
  const endData = handleEndData(newCardList, playerIndex);

  return {
    playgroundData: newPlaygroundData,
    [`players.${playerIndex}.cardList`]: newCardList,
    ...endData,
  };
}

function newRound(roundPlayer, players, roundSum) {
  const newRoundPlayer = (roundPlayer + 1) % players.length;

  return {
    roundPlayer: newRoundPlayer,
    roundTimeStamp: new Date(),
    roundSum: roundSum + 1,
  };
}

function handleEndData(list, playerIndex) {
  if (list.length === 0) {
    return {
      end: true,
      endTime: new Date(),
      winner: playerIndex,
    };
  }

  return null;
}

function tidyPlayground(playgroundData) {
  const rowColorMap = [];
  let tempList = [];
  for (let i = GROUND_COL_LEN - 1; i >= 0; i--) {
    for (let j = 0; j < GROUND_ROW_LEN; j++) {
      const card = playgroundData[i][j];
      // 中断 或者 新的一行
      if ((!card || j === 0) && tempList.length >= 3) {
        handleSetToProperPos(tempList, playgroundData, rowColorMap);
        tempList = [];
      }
      if (card) {
        tempList.push(card);
      }
    }
  }
}

function handleSetToProperPos(list, playgroundData, rowColorMap) {
  const L = list.length;
  const type = judgeSetType(list);
  if (type === RUMMY_SET_TYPE.samevalue) {
    for (let i = 0; i < sameValueIndexList.length; i++) {
      const index = sameValueIndexList[i];
      const { rowIndex, colIndex } = getGroundCrossByIndex(index);
      const placeCard = playgroundData[colIndex][rowIndex];
      const hasPlace = !placeCard || getCardIndexByID(list, placeCard.id) >= 0;
      if (hasPlace) {
        placeSetToGroundByIndex(list, index, playgroundData);
        break;
      }
    }
  } else {
    let firstCardValue, firstCardColor;
    list.forEach((card, index) => {
      if (card.value === 0) return;
      firstCardValue = card.value - index;
      firstCardColor = card.color;
    });
    const straightIndexList = getStraightIndexListByValue(firstCardValue);
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
        break;
      }
    }
  }
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
