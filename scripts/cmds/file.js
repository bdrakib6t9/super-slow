const fs = require("fs");
const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "file",
    version: "1.9",
    author: "hoon",
    countDown: 5,
    role: 0,
    category: "admin",
    guide: "{pn} <fileName>"
  },

  onStart: async function ({ args, api, event }) {

    // 🔒 Owner Check (string-safe)
    if (!ownerUID.includes(String(event.senderID))) {
      return api.sendMessage(
        "❌ | You are not allowed to use this command.",
        event.threadID,
        event.messageID
      );
    }

    const fileName = args[0];

    if (!fileName) {
      return api.sendMessage(
        "❌ | Please provide a file name.",
        event.threadID,
        event.messageID
      );
    }

    const filePath = __dirname + `/${fileName}.js`;

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(
        `❌ | File not found: ${fileName}.js`,
        event.threadID,
        event.messageID
      );
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      return api.sendMessage(
        { body: fileContent },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      return api.sendMessage(
        "❌ | Failed to read file.",
        event.threadID,
        event.messageID
      );
    }
  }
};
