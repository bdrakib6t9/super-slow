const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dhp",
    aliases: ["avatar"],
    version: "1.1",
    author: "Rakib",
    role: 0,
    shortDescription: "download profile picture",
    longDescription: "download facebook user profile picture",
    category: "media",
    guide: {
      en: "{pn} @mention | reply | uid"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      let uid;

      // 🔵 Reply → replied user
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      }

      // 🔵 Mention → first mentioned user
      else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }

      // 🔵 UID argument
      else if (args[0]) {
        uid = args[0];
      }

      // 🔵 Default → command sender
      else {
        uid = event.senderID;
      }

      const apiUrl = `https://rakib-api.vercel.app/api/fb-avatar?uid=${uid}&apikey=rakib69`;

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer"
      });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `${uid}.jpg`);
      fs.writeFileSync(filePath, res.data);

      api.sendMessage(
        {
          body: "✅ Profile picture downloaded",
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Failed to download profile picture.\nCheck UID or API status.",
        event.threadID,
        event.messageID
      );
    }
  }
};
