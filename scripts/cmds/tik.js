const fs = require("fs");
const path = require("path");
const axios = require("axios");
const tikApi = require("../../rakib/customApi/tikApi");

module.exports = {
  config: {
    name: "tik",
    version: "1.0",
    author: "Rakib",
    role: 0,
    shortDescription: "Download TikTok video",
    category: "media",
    guide: {
      en: "{pn} <tiktok link>"
    }
  },

  onStart: async function ({ api, event, args }) {

    const url = args[0];

    if (!url)
      return api.sendMessage(
        "❌ Please provide a TikTok link.",
        event.threadID
      );

    api.sendMessage("⏳ Fetching TikTok video...", event.threadID);

    const data = await tikApi(url);

    if (data.error)
      return api.sendMessage(`❌ ${data.error}`, event.threadID);

    const filePath = path.join(
      __dirname,
      "cache",
      `tiktok_${event.senderID}.mp4`
    );

    try {
      const stream = await axios({
        url: data.video,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎬 TikTok Video Downloaded

👤 Author: ${data.author}
📝 Title: ${data.title}
🚫 Watermark: Removed
💎 Quality: HD

Powered by Rakib API`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath)
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Video download failed.", event.threadID);
    }
  }
};
