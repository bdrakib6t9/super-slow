//logsbot.js
const { getTime } = global.utils;

module.exports = {
  config: {
    name: "logsbot",
    isBot: true,
    version: "1.5",
    author: "NTKhang (fixed by Rakib)",
    category: "events"
  },

  langs: {
    en: {
      title: "====== Bot Logs ======",
      added: "\n✅ Bot added to a new group\n- Added by: %1",
      kicked: "\n❌ Bot was kicked from a group\n- Kicked by: %1",
      footer: "\n- User ID: %1\n- Group: %2\n- Group ID: %3\n- Time: %4"
    }
  },

  onStart: async function ({ usersData, threadsData, event, api, getLang }) {
    try {
      const botID = api.getCurrentUserID();
      const { logMessageType, logMessageData, threadID, author } = event;

      // only care about subscribe/unsubscribe
      if (!["log:subscribe", "log:unsubscribe"].includes(logMessageType)) return;

      let isBotEvent = false;

      if (
        logMessageType === "log:subscribe" &&
        logMessageData?.addedParticipants?.some(p => p.userFbId == botID)
      ) {
        isBotEvent = "added";
      }

      if (
        logMessageType === "log:unsubscribe" &&
        logMessageData?.leftParticipantFbId == botID
      ) {
        isBotEvent = "kicked";
      }

      if (!isBotEvent) return;
      if (author == botID) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Unknown";
      const authorName = await usersData.getName(author);

      let msg = getLang("title");
      msg += getLang(isBotEvent, authorName);

      const time = getTime("DD/MM/YYYY HH:mm:ss");
      msg += getLang("footer", author, threadName, threadID, time);

      const { adminBot } = global.GoatBot.config;

      for (const adminID of adminBot) {
        await api.sendMessage(msg, adminID);
      }

    } catch (err) {
      console.error("logsbot error:", err);
    }
  }
};
