import { handleGameAction } from "@/pages/Rummy/game/api";

export async function showAdForScore(gameID: string) {
  await handleGameAction(gameID, "showAdForScore", {});
}
