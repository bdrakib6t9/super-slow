const fs = require("fs");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "spy",
    version: "1.1",
    author: "Rakib",
    countDown: 60,
    role: 0,
    shortDescription: "Get user information and avatar",
    longDescription: "Get user information and avatar by mentioning",
    category: "image",
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions || {})[0];
      let uid;

      // -------------------------
      // UID FROM ARG / LINK
      // -------------------------
      if (args[0]) {
        // numeric UID
        if (/^\d+$/.test(args[0])) {
          uid = args[0];
        } else {
          // profile link
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) uid = match[1];
        }
      }

      // -------------------------
      // FALLBACK TARGET
      // -------------------------
      if (!uid) {
        uid =
          event.type === "message_reply" && event.messageReply?.senderID
            ? event.messageReply.senderID
            : uid2 || uid1;
      }

      // -------------------------
      // USER INFO
      // -------------------------
      const info = await api.getUserInfo(uid);
      const userInfo = info?.[uid];

      if (!userInfo) {
        return message.reply("❌ Failed to retrieve user information.");
      }

      // -------------------------
      // AVATAR (LOCAL CACHE)
      // -------------------------
      const avatarPath = await getAvatarUrl(uid).catch(() => null);

      // -------------------------
      // GENDER
      // -------------------------
      let genderText;
      switch (userInfo.gender) {
        case 1:
          genderText = "Girl";
          break;
        case 2:
          genderText = "Boy";
          break;
        default:
          genderText = "Unknown";
      }

      // -------------------------
      // MESSAGE
      // -------------------------
      const userInformation =
        `❏ Name: ${userInfo.name}\n` +
        `❏ Profile URL: ${userInfo.profileUrl}\n` +
        `❏ Gender: ${genderText}\n` +
        `❏ User Type: ${userInfo.type}\n` +
        `❏ Is Friend: ${userInfo.isFriend ? "Yes" : "No"}\n` +
        `❏ Is Birthday today: ${userInfo.isBirthday ? "Yes" : "No"}`;

      return message.reply({
        body: userInformation,
        attachment:
          avatarPath && fs.existsSync(avatarPath)
            ? fs.createReadStream(avatarPath)
            : null
      });

    } catch (err) {
      console.error("spy command error:", err);
      return message.reply("❌ Spy command failed.");
    }
  }
};
