const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "edc",
    aliases: ["edc"],
    version: "1.2",
    author: "Rakib",
    role: 0,
    shortDescription: "deploy event file",
    longDescription: "load js file into events folder (owner only)",
    category: "Bot account",
    guide: {
      en: "Reply a link and type: edc <eventName>"
    }
  },

  onStart: async function ({ api, event, args }) {

    // 🔒 Owner Check (string-safe)
    if (!ownerUID.includes(String(event.senderID))) {
      return api.sendMessage(
        "❌ | You aren't allowed to use this command.",
        event.threadID,
        event.messageID
      );
    }

    const fs = require("fs");
    const axios = require("axios");
    const request = require("request");
    const cheerio = require("cheerio");
    const path = require("path");

    const { messageReply, threadID, messageID } = event;
    const name = args[0];

    if (!messageReply || !name) {
      return api.sendMessage(
        "❌ Reply to a code link and use: edc <eventName>",
        threadID,
        messageID
      );
    }

    const text = messageReply.body;
    const urlRegex = /https?:\/\/[^\s]+/;
    const url = text.match(urlRegex);

    if (!url) {
      return api.sendMessage("❌ Invalid link.", threadID, messageID);
    }

    const savePath = path.join(__dirname, "../events", `${name}.js`);

    // ===== Pastebin =====
    if (url[0].includes("pastebin")) {
      try {
        const res = await axios.get(url[0]);
        fs.writeFileSync(savePath, res.data, "utf-8");
        return api.sendMessage(
          `✅ Event file added: ${name}.js\n👉 Use restart/load to apply`,
          threadID,
          messageID
        );
      } catch (e) {
        return api.sendMessage("❌ Failed to apply pastebin code.", threadID, messageID);
      }
    }

    // ===== Buildtool / TinyURL =====
    if (url[0].includes("buildtool") || url[0].includes("tinyurl")) {
      request(url[0], (err, res, body) => {
        if (err)
          return api.sendMessage("❌ Error fetching link.", threadID, messageID);

        const $ = cheerio.load(body);
        const code = $(".language-js").first().text();

        if (!code)
          return api.sendMessage("❌ No JS code found.", threadID, messageID);

        fs.writeFileSync(savePath, code, "utf-8");
        return api.sendMessage(
          `✅ Event file added: ${name}.js`,
          threadID,
          messageID
        );
      });
      return;
    }

    // ===== Google Drive =====
    if (url[0].includes("drive.google")) {
      try {
        const id = url[0].match(/[-\w]{25,}/);
        if (!id) throw new Error("Invalid Drive ID");

        const downloadUrl = `https://drive.google.com/uc?id=${id[0]}&export=download`;
        const res = await axios.get(downloadUrl, { responseType: "arraybuffer" });

        fs.writeFileSync(savePath, res.data);
        return api.sendMessage(
          `✅ Event file added: ${name}.js\n⚠️ If error, save drive file as .txt`,
          threadID,
          messageID
        );
      } catch (e) {
        return api.sendMessage("❌ Failed to download from Drive.", threadID, messageID);
      }
    }

    return api.sendMessage("❌ Unsupported link.", threadID, messageID);
  }
};
