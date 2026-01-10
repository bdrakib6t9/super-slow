const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    version: "3.1",
    author: "Rakib",
    role: 0,
    shortDescription: "Search TikTok videos & download by reply",
    longDescription: {
      en: "Search TikTok videos, reply with a number to download"
    },
    category: "media",
    guide: {
      en: "{pn} <search text>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query)
      return api.sendMessage(
        "❌ Usage: tiktok <search text>",
        event.threadID
      );

    api.sendMessage("🔍 Searching TikTok videos...", event.threadID);

    try {
      const res = await axios.get(
        `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}`
      );

      const videos = res.data?.data?.videos?.slice(0, 10);
      if (!videos || videos.length === 0)
        return api.sendMessage("❌ No videos found.", event.threadID);

      let msg = "🎵 TikTok Search Result\n\n";
      videos.forEach((v, i) => {
        msg += `${i + 1}. 👤 ${v.author.unique_id}\n`;
      });
      msg += "\n🔢 Reply with a number (1–10)";

      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "tiktok",
          videos
        });
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to fetch TikTok videos.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const choice = parseInt(event.body);
    const videos = Reply.videos;

    if (isNaN(choice) || choice < 1 || choice > videos.length)
      return api.sendMessage("❌ Invalid number.", event.threadID);

    const video = videos[choice - 1];
    const videoUrl = video.play;
    const filePath = path.join(__dirname, "cache", "tiktok.mp4");

    api.sendMessage("⬇️ Downloading video...", event.threadID);

    try {
      const stream = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body:
`🚀 𝗧𝗘𝗦𝗦𝗔 𝗕𝗢𝗧 🤖
🎬 𝗧𝗶𝗸𝗧𝗼𝗸 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗲𝗱
💎 𝗤𝘂𝗮𝗹𝗶𝘁𝘆 𝗖𝗼𝗻𝘁𝗲𝗻𝘁
modified:hoon`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath)
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Download failed.", event.threadID);
    }
  }
};
