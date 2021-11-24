import { DB, getPlayerByOpenid } from "../../utils";

export async function getMost(receiveFrom: Gift["receiveFrom"][string]) {
  let max = 0;
  let _openid = null;
  Object.entries(receiveFrom).forEach(([openid, n]) => {
    if (n > max) {
      max = n;
      _openid = openid;
    }
  });

  return await getPlayerByOpenid(_openid);
}
