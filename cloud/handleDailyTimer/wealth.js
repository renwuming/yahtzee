async function execHandleDailyWealthRecord(db) {
  const _ = db.command;

  // 清空每日福利的领取记录
  const list = await db
    .collection("players")
    .where({
      wealthRecord: _.exists(1),
    })
    .limit(1000) // TODO 分页查询
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

module.exports = {
  execHandleDailyWealthRecord,
};
