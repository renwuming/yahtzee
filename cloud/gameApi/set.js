const cloud = require("wx-server-sdk");

const MAX_PLAYERS = 4;

const COLORS = ["red", "green", "purple"];
const SHAPES = ["diamond", "rect", "S"];
const FILLS = ["empty", "solid", "line"];
const AMOUNTS = [1, 2, 3];
const CARD_LIST = COLORS.reduce((list, color) => {
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
}, []).map((item, index) => ({
  ...item,
  index,
}));

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

  const { result: player } = await cloud.callFunction({
    name: "getPlayers",
    data: {
      openid: OPENID,
    },
  });

  const [gameCardList, reserveCardList] = initCardList();
  const date = new Date();
  const res = await db.collection(gameDbName).add({
    data: {
      start: false,
      owner: player,
      players: [player],
      _createTime: date,
      _updateTime: date,
      gameCardList,
      reserveCardList,
      selectedCardList: [],
      timer: true,
    },
  });

  db.collection("game_events").add({
    data: {
      gameID: res._id,
    },
  });

  return res;
};

exports.handleGame = async function handleGame(id, action, data, gameDbName) {
  const db = cloud.database();

  // 先读旧数据
  const { _id, ...oldData } = await db
    .collection(gameDbName)
    .doc(id)
    .get()
    .then((res) => res.data);

  const newData = await handleUpdateData(action, oldData, data, id, gameDbName);

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

async function handleUpdateData(action, oldData, data, id, gameDbName) {
  const { OPENID } = cloud.getWXContext();
  const { owner, players, start } = oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inGame = playerIndex >= 0;
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    players.forEach((player) => {
      player.sumScore = 0;
      player.successSum = 0;
      player.failSum = 0;
    });
    return {
      startTime: new Date(),
      start: true,
      players,
    };
  }
  // 加入游戏
  else if (action === "joinGame" && !inGame && players.length < MAX_PLAYERS) {
    // 获取用户数据
    const { result: player } = await cloud.callFunction({
      name: "getPlayers",
      data: {
        openid: OPENID,
      },
    });
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
  // 提交 Set
  else if (action === "submitSet") {
    const { list } = data;
    const newData = await submitSet(
      list,
      players,
      playerIndex,
      oldData,
      id,
      gameDbName
    );

    return newData;
  } else if (action === "endByTimer") {
    const winners = getWinners(players);
    return {
      end: true,
      winners,
    };
  }

  return null;
}

function initCardList() {
  let initList = [];
  let continueFlag = true;
  while (continueFlag) {
    initList = shuffle(CARD_LIST);
    if (judgeSetExists(initList.slice(0, 12))) {
      continueFlag = false;
    }
  }
  return [initList.slice(0, 12), initList.slice(12)];
}

function judgeSetExists(list) {
  const L = list.length;
  for (let i = 0; i < L; i++)
    for (let j = i + 1; j < L; j++)
      for (let k = j + 1; k < L; k++) {
        const judgeList = [list[i], list[j], list[k]];
        if (judgeSet(judgeList)) return judgeList;
      }

  return false;
}

function judgeSet(list) {
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

function getKinds(list, key) {
  if (list.some((item) => !item.color)) return 0;
  return Array.from(new Set(list.map((item) => item[key]))).length;
}

function shuffle(arr) {
  var length = arr.length,
    temp,
    random;
  while (0 != length) {
    random = Math.floor(Math.random() * length);
    length--;
    // swap
    temp = arr[length];
    arr[length] = arr[random];
    arr[random] = temp;
  }
  return arr;
}

async function submitSet(list, players, playerIndex, oldData, id, gameDbName) {
  const player = players[playerIndex];
  const success = judgeSet(list);

  if (success) {
    // 先更新被选过的卡片
    await updateSelectedCardList(list, id, gameDbName);

    player.successSum += 1;
    player.sumScore += 2;

    const { gameCardList, reserveCardList, selectedCardList } = oldData;
    const _selectedCardList = selectedCardList.concat(list);
    const newCardList = gameCardList.filter(
      (item) => !inList(_selectedCardList, item)
    );

    const fillN = 12 - newCardList.length;
    const maxLoopSum = Math.ceil(reserveCardList.length / fillN);
    let loopSum = 0;
    let newReserveCardList = reserveCardList;
    let addList = [];
    let continueFlag = true;
    let end = false;
    let winners = [];
    while (continueFlag) {
      addList = newReserveCardList.splice(0, fillN);
      const list = newCardList.concat(addList);
      if (judgeSetExists(list)) {
        continueFlag = false;
      } else if (loopSum >= maxLoopSum) {
        continueFlag = false;
        end = true;
      } else {
        newReserveCardList = newReserveCardList.concat(addList);
      }
      loopSum++;
    }
    // 在原位置更新 Card
    let i = 0;
    gameCardList.forEach((item, index) => {
      if (i >= fillN) return;
      if (inList(_selectedCardList, item)) {
        gameCardList[index] = addList[i] || {};
        i++;
      }
    });

    // 被选过的卡片
    const cardList = await getSelectedCardList(id, gameDbName);
    if (cardList !== _selectedCardList) {
      submitSet(list, players, playerIndex, oldData, id, gameDbName);
    } else {
      if (end) {
        winners = getWinners(players);
      }

      return {
        gameCardList,
        reserveCardList,
        end,
        winners,
        [`players.${playerIndex}`]: player,
      };
    }
  } else {
    player.failSum += 1;
    player.sumScore = Math.max(0, player.sumScore - 1);

    return {
      [`players.${playerIndex}`]: player,
    };
  }
}

async function updateSelectedCardList(list, id, gameDbName) {
  const db = cloud.database();
  const _ = db.command;
  return await db
    .collection(gameDbName)
    .doc(id)
    .update({
      data: {
        selectedCardList: _.push(list),
      },
    });
}
async function getSelectedCardList(id, gameDbName) {
  const db = cloud.database();
  const { selectedCardList } = await db
    .collection(gameDbName)
    .doc(id)
    .get()
    .then((res) => res.data);
  return selectedCardList;
}

function inList(list, item) {
  return list.map((item) => item.index).includes(item.index);
}

function getWinners(players) {
  const list = players
    .concat()
    .sort((item, item2) => item2.sumScore - item.sumScore);
  let maxScore = 0;
  const winners = [];
  list.forEach(({ sumScore, openid }) => {
    if (sumScore >= maxScore && sumScore > 0) {
      maxScore = sumScore;
      const openids = players.map((item) => item.openid);
      const index = openids.indexOf(openid);
      winners.push(index);
    }
  });

  return winners;
}
