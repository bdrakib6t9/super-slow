module.exports = {
  config: {
    name: "out",
    version: "1.0",
    author: "Rakib",
    countDown: 3,
    role: 2, // only bot admin / owner
    description: {
      vi: "Bot sẽ rời khỏi nhóm",
      en: "Bot will leave the group"
    },
    category: "system",
    guide: {
      vi: "{pn} hoặc {pn} <threadID>",
      en: "{pn} or {pn} <threadID>"
    }
  },

  langs: {
    vi: {
      left: "👋 Bot đã rời khỏi nhóm này",
      leftTid: "✅ Bot đã rời khỏi nhóm có ID: %1",
      error: "❌ Không thể rời khỏi nhóm"
    },
    en: {
      left: "👋 Bot has left this group",
      leftTid: "✅ Bot has left group ID: %1",
      error: "❌ Cannot leave the group"
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    try {
      // যদি threadID দেওয়া হয়
      if (args[0]) {
        const tid = args[0];
        await api.removeUserFromGroup(api.getCurrentUserID(), tid);
        return message.reply(getLang("leftTid", tid));
      }

      // না দিলে বর্তমান গ্রুপ থেকে leave
      await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
    }
    catch (e) {
      return message.reply(getLang("error"));
    }
  }
};
