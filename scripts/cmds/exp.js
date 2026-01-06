module.exports = {
  config: {
    name: "exp",
    aliases: ["xp"],
    version: "2.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: {
      vi: "xem EXP của bạn hoặc người khác",
      en: "view your EXP or others EXP",
      bn: "নিজের অথবা অন্যের EXP দেখুন"
    },
    category: "economy",
    guide: {
      vi: "{pn}: xem EXP của bạn\n{pn} @tag: xem EXP người được tag",
      en: "{pn}: view your EXP\n{pn} @tag: view tagged user's EXP",
      bn: "{pn}: তোমার EXP দেখবে\n{pn} @tag: ট্যাগ করা ইউজারের EXP দেখবে"
    }
  },

  langs: {
    vi: {
      expSelf: "✨ EXP của bạn: %1",
      expOther: "✨ EXP của %1: %2",
      noData: "Không tìm thấy dữ liệu EXP."
    },
    en: {
      expSelf: "✨ Your EXP: %1",
      expOther: "✨ %1's EXP: %2",
      noData: "EXP data not found."
    },
    bn: {
      expSelf: "✨ তোমার EXP: %1",
      expOther: "✨ %1 এর EXP: %2",
      noData: "EXP ডাটা পাওয়া যায়নি।"
    }
  },

  onStart: async function ({ message, event, usersData, getLang }) {
    const senderID = event.senderID;

    /* =====================
       👤 MENTION USER EXP
    ===================== */
    if (Object.keys(event.mentions || {}).length > 0) {
      const targetID = Object.keys(event.mentions)[0];
      const targetName = event.mentions[targetID];

      const targetData = await usersData.get(targetID);
      if (!targetData)
        return message.reply(getLang("noData"));

      const exp = targetData.exp || 0;
      return message.reply(
        getLang("expOther", targetName, exp)
      );
    }

    /* =====================
       👤 SELF EXP
    ===================== */
    const userData = await usersData.get(senderID);
    if (!userData)
      return message.reply(getLang("noData"));

    const exp = userData.exp || 0;
    return message.reply(
      getLang("expSelf", exp)
    );
  }
};
