import { CallCloudFunction } from "../../../utils";
import { PAGE_LEN } from "../../../const";

export async function getHallGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "yahtzeeGetHallGames",
    data: {
      skip,
      pageLength: PAGE_LEN,
    },
  });
}

export async function getMyGames(pageNum) {
  const skip = PAGE_LEN * pageNum;

  return await CallCloudFunction({
    name: "yahtzeeGetMyGames",
    data: {
      skip,
      type: "hall",
      pageLength: PAGE_LEN,
    },
  });
}
