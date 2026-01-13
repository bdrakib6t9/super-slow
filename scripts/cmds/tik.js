const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tik",
    version: "4.0",
    author: "Rakib",
    role: 0,
    shortDescription: "Search TikTok videos with page & download",
    longDescription: {
      en: "Search TikTok videos, page system, reply to download"
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
        `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(
          query
        )}`
      );

      const results = res.data?.data?.videos;
      if (!results || results.length === 0)
        return api.sendMessage("❌ No videos found.", event.threadID);

      await sendPage(api, event, results, 1, query);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to fetch TikTok videos.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const body = event.body.toLowerCase();

    // 👉 next page
    if (body === "next") {
      const nextPage = Reply.page + 1;
      return sendPage(
        api,
        event,
        Reply.results,
        nextPage,
        Reply.query
      );
    }

    // 👉 download by number
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > 10)
      return api.sendMessage("❌ Invalid reply.", event.threadID);

    const index = (Reply.page - 1) * 10 + (choice - 1);
    const video = Reply.results[index];
    if (!video)
      return api.sendMessage("❌ Video not found.", event.threadID);

    const filePath = path.join(
      __dirname,
      "cache",
      `tiktok_${event.senderID}.mp4`
    );

    api.sendMessage("⬇️ Downloading video...", event.threadID);

    try {
      const stream = await axios({
        url: video.play,
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
🎬 TikTok Video Delivered
💎 High Quality
modified by hoon`,
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

/* ================= PAGE FUNCTION ================= */

async function sendPage(api, event, results, page, query) {
  const start = (page - 1) * 10;
  const pageResults = results.slice(start, start + 10);

  if (pageResults.length === 0)
    return api.sendMessage("❌ No more results.", event.threadID);

  let msg = `🎵 TikTok Results (${query})\n📄 Page ${page}\n\n`;
  const attachments = [];

  for (let i = 0; i < pageResults.length; i++) {
    const v = pageResults[i];

    msg += `${i + 1}. 🎬 ${
      v.title ? v.title.slice(0, 40) : "Untitled"
    }\n`;
    msg += `👤 ${v.author?.unique_id || "Unknown"}\n`;
    msg += `👁️ ${v.play_count || 0} views\n\n`;

    // cover image
    try {
      const imgPath = path.join(
        __dirname,
        "cache",
        `tt_${event.senderID}_${page}_${i}.jpg`
      );
      const imgRes = await axios.get(v.cover, {
        responseType: "arraybuffer"
      });
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
      attachments.push(fs.createReadStream(imgPath));
    } catch {}
  }

  msg += "👉 Reply with 1–10 to download\n➡️ Type 'next' for more";

  api.sendMessage(
    { body: msg, attachment: attachments },
    event.threadID,
    (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "tiktok",
        results,
        page,
        query
      });
    }
  );
                    }
