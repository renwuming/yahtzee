import { CallCloudFunction } from "../../../utils";
import { PAGE_LEN } from "../../../const";

export async function getHallGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "martianGetHallGames",
    data: {
      skip,
    },
  });
}

export async function getMyGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "martianGetMyGames",
    data: {
      skip,
      type: "hall",
    },
  });
}
