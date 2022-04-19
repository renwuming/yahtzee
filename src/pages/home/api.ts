import { DB } from "@/utils";

export async function getGameList() {
  const list = await DB.collection("homepage_games")
    .orderBy("index", "desc")
    .get()
    .then((res) => res.data);
  return list;
}
