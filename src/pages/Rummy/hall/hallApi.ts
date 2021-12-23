import { CallCloudFunction } from "../../../utils";
import { PAGE_LEN } from "../../../const";

export async function getHallGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "findList",
      gameDbName: "rummy_games",
      data: {
        type: "hall",
        skip,
        pageLength: PAGE_LEN,
      },
    },
  });
}

export async function getMyGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "gameApi",
    data: {
      action: "findList",
      gameDbName: "rummy_games",
      data: {
        type: "hall-mine",
        skip,
        pageLength: PAGE_LEN,
      },
    },
  });
}
