const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
* @author hoon
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "cockroach",
    aliases: ["cock"],
    version: "1.7",
    author: "hoon",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "[mention/reply/UID]",
  },

  onStart: async function({ api, event, args }) {

    // new author protection for "hoon"
    const obfuscatedAuthor = String.fromCharCode(104, 111, 111, 110); // "hoon"

    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.\n",
        event.threadID,
        event.messageID
      );
    }

    const { mentions, threadID, messageID, messageReply } = event;
    let id;

    if (Object.keys(mentions).length > 0) {
      id = Object.keys(mentions)[0];
    } else if (messageReply) {
      id = messageReply.senderID;
    } else if (args[0]) {
      id = args[0];
    } else {
      return api.sendMessage(
        "❌ Mention, reply, or give UID to make cockroach someone",
        threadID,
        messageID
      );
    }

    try {
      const apiUrl = await baseApiUrl();
      const url = `${apiUrl}/api/cockroach?user=${id}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `cockroach_${id}.png`);

      fs.writeFileSync(filePath, response.data);

      api.sendMessage(
        {
          attachment: fs.createReadStream(filePath),
          body: "Here's your cockroach image 🪳"
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );

    } catch (err) {
      api.sendMessage(`🥹 error, contact hoon.`, threadID, messageID);
    }
  }
};
