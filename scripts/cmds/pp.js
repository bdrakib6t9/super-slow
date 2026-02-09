const fs = require("fs");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "pp",
    aliases: ["dp"],
    version: "1.1",
    author: "Rakib",
    category: "utility",
    guide: "{prefix}pp (reply / mention / empty = own dp)"
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      let targetID = event.senderID;

      // 1️⃣ reply থাকলে
      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      }
      // 2️⃣ mention থাকলে
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      const name = await usersData.getName(targetID).catch(() => "User");

      const avatarPath = await getAvatarUrl(targetID);

      if (!avatarPath || !fs.existsSync(avatarPath)) {
        return message.reply("❌ এই ইউজারের প্রোফাইল পিক পাওয়া যায়নি।");
      }

      return message.reply({
        body: `🖼️ ${name} এর প্রোফাইল পিক`,
        attachment: fs.createReadStream(avatarPath)
      });

    } catch (err) {
      console.error("pp command error:", err);
      return message.reply("❌ Profile picture আনতে সমস্যা হয়েছে।");
    }
  }
};
