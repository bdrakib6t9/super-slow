const fs = require("fs-extra");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "userinfo",
    aliases: ["uinfo"],
    version: "1.5",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Show full user information",
    longDescription: "User info with rank system",
    category: "info",
    guide: {
      en: "{p}userinfo | reply + {p}userinfo | {p}userinfo @mention"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      let targetID;

      // -------------------------
      // TARGET PRIORITY
      // -------------------------
      if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        targetID = event.senderID;
      }

      // -------------------------
      // USER BASIC INFO
      // -------------------------
      const userInfo = await api.getUserInfo(targetID);
      const data = userInfo[targetID] || {};

      const name = data.name || "Unknown";
      const gender =
        data.gender == 1 ? "Female" :
        data.gender == 2 ? "Male" : "Unknown";

      const profile = data.profileUrl || "Not available";

      // -------------------------
      // ACCOUNT CREATED (EST.)
      // -------------------------
      let createdTime = "Not available";
      if (!isNaN(targetID)) {
        createdTime = new Date(parseInt(targetID) / 1000).toLocaleString("en-GB");
      }

      // -------------------------
      // NICKNAME
      // -------------------------
      let nickname = "Not available";
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        nickname = threadInfo.nicknames?.[targetID] || "Not available";
      } catch {}

      // -------------------------
      // MESSAGE COUNT
      // -------------------------
      let totalMsg = "Not available";
      try {
        const msg = await usersData.get(targetID, "messageCount");
        if (typeof msg === "number") totalMsg = msg;
      } catch {}

      // -------------------------
      // EXP & LEVEL
      // -------------------------
      let exp = "Not available";
      let level = "Not available";
      try {
        const userExp = await usersData.get(targetID, "exp");
        if (typeof userExp === "number") {
          exp = userExp;
          level = Math.floor(Math.sqrt(userExp / 100));
        }
      } catch {}

      // -------------------------
      // LOCALE
      // -------------------------
      const locale = data.locale || "Not available";

      // -------------------------
      // AVATAR (LOCAL CACHE PATH)
      // -------------------------
      const avatarPath = await getAvatarUrl(targetID).catch(() => null);

      // -------------------------
      // SEND MESSAGE
      // -------------------------
      return api.sendMessage(
        {
          body:
            `👤 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎\n\n` +
            `🔹 𝐍𝐚𝐦𝐞: ${name}\n` +
            `🆔 𝐔𝐬𝐞𝐫 𝐈𝐃: ${targetID}\n` +
            `⚥ 𝐆𝐞𝐧𝐝𝐞𝐫: ${gender}\n` +
            `🧩 𝐍𝐢𝐜𝐤𝐧𝐚𝐦𝐞: ${nickname}\n` +
            `🕒 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐂𝐫𝐞𝐚𝐭𝐞𝐝: ${createdTime}\n` +
            `💬 𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬: ${totalMsg}\n` +
            `🧠 𝐋𝐞𝐯𝐞𝐥: ${level}\n` +
            `✨ 𝐄𝐗𝐏: ${exp}\n` +
            `📍 𝐋𝐨𝐜𝐚𝐥𝐞: ${locale}\n` +
            `🔗 𝐏𝐫𝐨𝐟𝐢𝐥𝐞: ${profile}`,
          attachment:
            avatarPath && fs.existsSync(avatarPath)
              ? fs.createReadStream(avatarPath)
              : null
        },
        event.threadID,
        event.messageID
      );

    } catch (e) {
      console.error("userinfo error:", e);
      api.sendMessage("❌ User info আনতে সমস্যা হয়েছে!", event.threadID);
    }
  }
};
