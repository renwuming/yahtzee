import { CallCloudFunction } from "../../utils";
import { PAGE_LEN } from "../../const";

export async function getHallGames(pageNum) {
  const pageLen = PAGE_LEN;
  const skip = pageLen * pageNum;

  return await CallCloudFunction({
    name: "yahtzeeGetHallGames",
    data: {
      skip,
    },
  });
}

export async function getMyGames(pageNum) {
  const pageLen = PAGE_LEN;
  const skip = pageLen * pageNum;

  return await CallCloudFunction({
    name: "yahtzeeGetMyGames",
    data: {
      skip,
      end: false,
    },
  });
}
