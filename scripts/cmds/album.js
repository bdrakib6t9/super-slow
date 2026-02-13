const axios = require("axios");
const fs = require("fs");
const path = require("path");
const tikApi = require("../../rakib/customApi/tikApi");

module.exports = {
  config: {
    name: "album",
    version: "5.0",
    author: "Rakib",
    role: 0,
    shortDescription: "Stylish Random Video Album",
    category: "media",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {

    const categories = [
      "funny", "islamic", "sad", "anime", "cartoon",
      "love", "couple", "flower", "marvel",
      "aesthetic", "sigma", "lyrics", "cat",
      "freefire", "football", "girl", "friends", "cricket"
    ];

    const numFont = n =>
      String(n).replace(/[0-9]/g, d =>
        String.fromCharCode(0x2460 + parseInt(d) - 1)
      );

    const styledList = categories
      .map((c, i) => `✨ ${numFont(i + 1)} ➤ ${c.toUpperCase()}`)
      .join("\n");

    return api.sendMessage(
      "╔『📂𝐀𝐋𝐁𝐔𝐌 𝐌𝐄𝐍𝐔📂』╗\n\n" +
      styledList +
      "\n\n╚════════════════╝\n\n💬 Reply with a number to choose",
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          categories
        });
      }
    );
  },

  onReply: async function ({ api, event, Reply }) {

    if (event.senderID != Reply.author)
      return api.sendMessage("❌ Only the menu opener can reply.", event.threadID);

    const index = parseInt(event.body);
    if (isNaN(index))
      return api.sendMessage("❌ Please reply with a valid number.", event.threadID);

    const categories = Reply.categories;

    if (index < 1 || index > categories.length)
      return api.sendMessage("❌ Invalid choice.", event.threadID);

    const selectedCategory = categories[index - 1];

    const loadingMsg = await api.sendMessage(
      `🔍 Searching Your Choice Video...\n🎬 Category: ${selectedCategory}`,
      event.threadID
    );

    try {

      // 🔎 Step 1: Search via tikwm
      const search = await axios.get(
        `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(selectedCategory)}`
      );

      const list = search.data.data?.videos || [];

      if (!list.length)
        return api.editMessage(
          "❌ No videos found for this category.",
          loadingMsg.messageID,
          event.threadID
        );

      const randomVideo = list[Math.floor(Math.random() * list.length)];

      if (!randomVideo.play)
        return api.editMessage(
          "❌ Failed to extract video URL.",
          loadingMsg.messageID,
          event.threadID
        );

      // 🔥 Step 2: Process via your API
      const data = await tikApi(randomVideo.play);

      if (data.error)
        return api.editMessage(
          `❌ ${data.error}`,
          loadingMsg.messageID,
          event.threadID
        );

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

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
            body: `🚀 𝗧𝗘𝗦𝗦𝗔 𝗕𝗢𝗧 🤖
🎬 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${selectedCategory}
👤 Author: ${data.author}
✨ Enjoy your video!`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath)
        );

        api.unsendMessage(loadingMsg.messageID);
      });

    } catch (error) {
      console.error(error);

      api.editMessage(
        "❌ Something went wrong while fetching video!",
        loadingMsg.messageID,
        event.threadID
      );
    }
  }
};
