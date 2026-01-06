const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "userinfo",
    aliases: ["uinfo"],
    version: "1.4",
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

      // Priority
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        targetID = event.senderID;
      }

      // ===== User basic =====
      const userInfo = await api.getUserInfo(targetID);
      const data = userInfo[targetID] || {};

      const name = data.name || "Unknown";
      const gender =
        data.gender == 1 ? "Female" :
        data.gender == 2 ? "Male" : "Unknown";

      const profile = data.profileUrl || "Not available";

      // ===== Account create (estimated) =====
      let createdTime = "Not available";
      if (!isNaN(targetID)) {
        createdTime = new Date(parseInt(targetID) / 1000).toLocaleString("en-GB");
      }

      // ===== Nickname =====
      let nickname = "Not available";
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        nickname = threadInfo.nicknames?.[targetID] || "Not available";
      } catch {}

      // ===== Message count =====
      let totalMsg = "Not available";
      try {
        const msg = await usersData.get(targetID, "messageCount");
        if (typeof msg === "number") totalMsg = msg;
      } catch {}

      // ===== EXP & Level =====
      let exp = "Not available";
      let level = "Not available";
      try {
        const userExp = await usersData.get(targetID, "exp");
        if (typeof userExp === "number") {
          exp = userExp;
          level = Math.floor(Math.sqrt(userExp / 100));
        }
      } catch {}

      // ===== Locale =====
      const locale = data.locale || "Not available";

      // ===== Avatar =====
      const avatarUrl = await usersData.getAvatarUrl(targetID).catch(() => null);
      const imgPath = __dirname + `/cache/${targetID}.png`;

      const sendInfo = () => {
        api.sendMessage(
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
            attachment: avatarUrl ? fs.createReadStream(imgPath) : null
          },
          event.threadID,
          () => {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          },
          event.messageID
        );
      };

      if (avatarUrl) {
        request(avatarUrl)
          .pipe(fs.createWriteStream(imgPath))
          .on("close", sendInfo)
          .on("error", sendInfo);
      } else sendInfo();

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ User info আনতে সমস্যা হয়েছে!", event.threadID);
    }
  }
};
