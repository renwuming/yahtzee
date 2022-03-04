async function execHandleDailyWealthRecord(db) {
  const _ = db.command;

  const GROUP_LEN = 2 * 100;
  const GROUP = 300;
  for (let i = 0; i < GROUP_LEN; i++) {
    const skip = i * GROUP;
    // 清空每日福利的领取记录
    const list = await db
      .collection("players")
      .where({
        wealthRecord: _.exists(1),
      })
      .skip(skip)
      .limit(GROUP)
      .get()
      .then((res) => res.data);
    await Promise.all(
      list.map((item) => {
        const { _id, wealthRecord } = item;
        const updateData = {};
        for (let key in wealthRecord) {
          const { refresh } = wealthRecord[key];
          if (refresh === "day") {
            updateData[`wealthRecord.${key}.times`] = 0;
          }
        }
        if (Object.keys(updateData).length > 0) {
          return db
            .collection("players")
            .doc(_id)
            .update({
              data: updateData,
            })
            .catch((err) => {
              console.error(err);
            });
        }
        return null;
      })
    );
  }
}

function sleep(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

module.exports = {
  execHandleDailyWealthRecord,
};
