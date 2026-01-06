module.exports = {
  config: {
    name: "userinfo-top",
    aliases: ["infotop"],
    version: "1.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Top users leaderboard",
    longDescription: "Top users by messages with level & exp",
    category: "ranking",
    guide: {
      en: "{p}userinfo-top | {p}infotop"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const allUsers = await usersData.getAll();

      if (!Array.isArray(allUsers) || allUsers.length === 0) {
        return api.sendMessage(
          "❌ 𝐍𝐨 𝐮𝐬𝐞𝐫 𝐝𝐚𝐭𝐚 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞!",
          event.threadID,
          event.messageID
        );
      }

      // Sort by messageCount
      const topUsers = allUsers
        .filter(u => typeof u.messageCount === "number")
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 10);

      if (topUsers.length === 0) {
        return api.sendMessage(
          "❌ 𝐌𝐞𝐬𝐬𝐚𝐠𝐞 𝐝𝐚𝐭𝐚 𝐧𝐨𝐭 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞!",
          event.threadID,
          event.messageID
        );
      }

      let msg = `📊 𝐓𝐎𝐏 𝟏𝟎 𝐔𝐒𝐄𝐑 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃\n\n`;

      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const uid = u.userID;

        let name = "Unknown";
        try {
          const info = await api.getUserInfo(uid);
          name = info[uid]?.name || "Unknown";
        } catch {}

        // EXP & Level
        let exp = "Not available";
        let level = "Not available";
        if (typeof u.exp === "number") {
          exp = u.exp;
          level = Math.floor(Math.sqrt(u.exp / 100));
        }

        msg +=
          `${i + 1}. 𝐍𝐚𝐦𝐞: ${name}\n` +
          `🆔 𝐈𝐃: ${uid}\n` +
          `💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬: ${u.messageCount}\n` +
          `🧠 𝐋𝐞𝐯𝐞𝐥: ${level}\n` +
          `✨ 𝐄𝐗𝐏: ${exp}\n\n`;
      }

      api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ 𝐋𝐞𝐚𝐝𝐞𝐫𝐛𝐨𝐚𝐫𝐝 লোড করতে সমস্যা হয়েছে!",
        event.threadID,
        event.messageID
      );
    }
  }
};
