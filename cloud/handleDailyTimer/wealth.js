async function execHandleDailyWealthRecord(db) {
  const _ = db.command;

  const THOUSAND_LEN = 10 * 10;
  const THOUSAND = 1000;

  for (let i = 0; i < THOUSAND_LEN; i++) {
    const skip = i * THOUSAND;

    // 清空每日福利的领取记录
    const list = await db
      .collection("players")
      .where({
        wealthRecord: _.exists(1),
      })
      .skip(skip)
      .limit(THOUSAND)
      .get()
      .then((res) => res.data);
    list.forEach((item) => {
      const { _id, wealthRecord } = item;
      const updateData = {};
      for (let key in wealthRecord) {
        const { refresh } = wealthRecord[key];
        if (refresh === "day") {
          updateData[`wealthRecord.${key}.times`] = 0;
        }
      }
      if (Object.keys(updateData).length > 0) {
        db.collection("players").doc(_id).update({
          data: updateData,
        });
      }
    });
  }
}

module.exports = {
  execHandleDailyWealthRecord,
};
