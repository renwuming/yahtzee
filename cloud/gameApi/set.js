const cloud = require("wx-server-sdk");

const { updatePlayer, getPlayer, findOne, shuffle } = require("./common");

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

  const player = await getPlayer(OPENID);

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
      recordList: [],
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
  const { owner, players, start } = oldData;
  const openids = players.map((item) => item.openid);
  const playerIndex = openids.indexOf(OPENID);
  const inGame = playerIndex >= 0;
  const own = OPENID === owner.openid;
  // 开始游戏
  if (action === "startGame" && own) {
    const { timer } = data;
    players.forEach((player) => {
      player.sumScore = 0;
      player.successSum = 0;
      player.failSum = 0;
    });
    return {
      startTime: new Date(),
      start: true,
      players,
      timer,
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
    const endData = handleEndData(players);
    return endData;
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

async function submitSet(
  list,
  oldPlayers,
  playerIndex,
  oldData,
  id,
  gameDbName
) {
  let player = oldPlayers[playerIndex];
  const success = judgeSet(list);
  const submitTime = new Date();

  const validSubmit = await judgeSubmitValid(
    player.openid,
    list,
    id,
    gameDbName
  );
  if (!validSubmit) return;

  // 先更新提交Set记录
  await updateSubmitRecord(
    submitTime,
    player.openid,
    list,
    success,
    oldData.gameCardList,
    id,
    gameDbName
  );
  // 获取最新游戏数据
  const { gameCardList, reserveCardList, selectedCardList, players } =
    await findOne(gameDbName, id);
  player = players[playerIndex];

  if (success) {
    player.successSum += 1;
    player.sumScore += 2;

    const newSelectedCardList = selectedCardList.concat(list);
    const newCardList = gameCardList.filter(
      (item) => !inList(newSelectedCardList, item)
    );

    const fillN = 12 - newCardList.length;
    const maxLoopSum =
      fillN === 0 ? 0 : Math.ceil(reserveCardList.length / fillN);
    let loopSum = 0;
    let newReserveCardList = reserveCardList;
    let addList = [];
    let continueFlag = true;
    let shouldEnd = false;
    while (continueFlag) {
      addList = newReserveCardList.splice(0, fillN);
      const list = newCardList.concat(addList);
      if (judgeSetExists(list)) {
        continueFlag = false;
      } else if (loopSum >= maxLoopSum) {
        continueFlag = false;
        shouldEnd = true;
      } else {
        newReserveCardList = newReserveCardList.concat(addList);
      }
      loopSum++;
    }
    // 在原位置更新 Card
    let i = 0;
    gameCardList.forEach((item, index) => {
      if (i >= fillN) return;
      if (inList(newSelectedCardList, item)) {
        gameCardList[index] = addList[i] || {};
        i++;
      }
    });

    // 本次Set提交，是最后一次提交 && 游戏未结束
    const { _submitTime, end } = await findOne(gameDbName, id);
    if (+_submitTime === +submitTime && !end) {
      const endData = shouldEnd ? handleEndData(players) : {};
      return {
        ...endData,
        gameCardList,
        reserveCardList: newReserveCardList,
        [`players.${playerIndex}`]: player,
      };
    } else {
      return {
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

async function updateSubmitRecord(
  submitTime,
  openid,
  submitList,
  success,
  gameCardList,
  id,
  gameDbName
) {
  const db = cloud.database();
  const _ = db.command;
  return await db
    .collection(gameDbName)
    .doc(id)
    .update({
      data: {
        selectedCardList: _.push(submitList),
        recordList: _.push({
          openid,
          submitList,
          success,
          gameCardList,
        }),
        _submitTime: submitTime,
      },
    });
}

async function judgeSubmitValid(_openid, _submitList, id, gameDbName) {
  const { recordList } = await findOne(gameDbName, id);
  const L = recordList.length;
  for (let index = 0; index < L; index++) {
    const { openid, submitList } = recordList[index];
    if (openid === _openid && isEqual(submitList, _submitList)) return false;
  }
  return true;
}

function inList(list, item) {
  return list.map((item) => item.index).includes(item.index);
}

function isEqual(list, list2) {
  return (
    list.map((item) => item.index).join(",") ===
    list2.map((item) => item.index).join(",")
  );
}

function handleEndData(players) {
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

  // 更新玩家成就
  updatePlayer(players, "set");

  return {
    winners,
    end: true,
    endTime: new Date(),
  };
}

exports.getRanking = async function getRanking(data) {
  const db = cloud.database();
  const _ = db.command;
  const { type, skip, pageLength } = data;

  const _skip = +(skip || 0);
  const _pageLength = +(pageLength || 10);

  if (type === "score") {
    const list = await db
      .collection("players")
      .where({
        "achievement.set.highScore": _.exists(1),
      })
      .orderBy("achievement.set.highScore", "desc")
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
  } else if (type === "time") {
    const list = await db
      .collection("players")
      .where({
        "achievement.set.bestTime": _.lt(300),
      })
      .orderBy("achievement.set.bestTime", "asc")
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
