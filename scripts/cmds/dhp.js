const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dhp",
    aliases: ["dhp", "avatar"],
    version: "1.0",
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

      // 🟢 Reply case
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      }

      // 🟢 Mention case
      else if (event.mentions) {
  const mentionIDs = Object.keys(event.mentions);
  if (mentionIDs.length > 0) {
    uid = mentionIDs[0];
  }
}

      // 🟢 UID argument
      else if (args[0]) {
        uid = args[0];
      }

      // ❌ No target
      else {
        uid = event.senderID; // default: sender
      }

      const apiUrl = `https://rakib-api.vercel.app/api/fb-avatar?uid=${uid}&apikey=rakib69`;

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, `/cache/${uid}.jpg`);
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
