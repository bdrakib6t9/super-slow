module.exports = {
  config: {
    name: "adc",
    aliases: ["adc"],
    version: "1.3",
    author: "Rakib",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Apply command from Google Drive (.txt)"
    },
    longDescription: {
      en: "Owner only – apply/update command files from Drive"
    },
    category: "Bot account",
    guide: {
      en: "{pn} <commandName> (reply to Drive txt link)"
    }
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_UID = "61581351693349";
    if (event.senderID !== OWNER_UID)
      return api.sendMessage(
        "❌ | You are not allowed to use this command.",
        event.threadID,
        event.messageID
      );

    const fs = require("fs");
    const path = require("path");
    const axios = require("axios");

    const { threadID, messageID, messageReply, type } = event;
    const fileName = args[0];

    if (!fileName)
      return api.sendMessage(
        "❌ | Usage: reply Drive .txt link and type: adc <commandName>",
        threadID,
        messageID
      );

    if (type !== "message_reply" || !messageReply.body)
      return api.sendMessage(
        "❌ | Please reply to a Google Drive .txt file link.",
        threadID,
        messageID
      );

    const driveLink = messageReply.body;
    if (!driveLink.includes("drive.google"))
      return api.sendMessage(
        "❌ | This is not a Google Drive link.",
        threadID,
        messageID
      );

    // extract file ID
    const idMatch = driveLink.match(/[-\w]{25,}/);
    if (!idMatch)
      return api.sendMessage(
        "❌ | Invalid Google Drive link.",
        threadID,
        messageID
      );

    const fileID = idMatch[0];
    const downloadURL = `https://drive.google.com/uc?id=${fileID}&export=download`;
    const savePath = path.join(__dirname, `${fileName}.js`);

    try {
      const res = await axios.get(downloadURL, { responseType: "arraybuffer" });
      fs.writeFileSync(savePath, res.data);

      return api.sendMessage(
        `✅ | Applied successfully!\n📄 File: ${fileName}.js\n👉 Now type: load ${fileName}`,
        threadID,
        messageID
      );
    } catch (err) {
      return api.sendMessage(
        `❌ | Failed to apply ${fileName}.js`,
        threadID,
        messageID
      );
    }
  }
};
