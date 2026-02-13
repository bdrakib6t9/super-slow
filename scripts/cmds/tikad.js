const fs = require("fs");
const path = require("path");
const axios = require("axios");
const tikApi = require("../../rakib/customApi/tikApi");

module.exports = {
  config: {
    name: "tikad",
    version: "1.0",
    author: "Rakib",
    role: 0,
    shortDescription: "Download TikTok audio",
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

    api.sendMessage("🎵 Fetching TikTok audio...", event.threadID);

    const data = await tikApi(url);

    if (data.error)
      return api.sendMessage(`❌ ${data.error}`, event.threadID);

    if (!data.music)
      return api.sendMessage("❌ Audio not found.", event.threadID);

    const filePath = path.join(
      __dirname,
      "cache",
      `tiktok_audio_${event.senderID}.mp3`
    );

    try {
      const stream = await axios({
        url: data.music,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎵 TikTok Audio Downloaded

👤 Author: ${data.author}
📝 Title: ${data.title}

Powered by Rakib API`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath)
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Audio download failed.", event.threadID);
    }
  }
};
