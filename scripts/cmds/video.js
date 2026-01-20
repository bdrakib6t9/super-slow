const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "video",
    version: "2.0",
    role: 0,
    author: "Rakib",
    cooldowns: 5,
    category: "media",
    usages: "{p}video <youtube name/link>"
  },

  onStart: async ({ api, event }) => {
    const args = event.body.split(" ");
    if (args.length < 2) {
      return api.sendMessage(
        "❌ | ব্যবহার:\n video <youtube নাম বা লিংক>",
        event.threadID
      );
    }

    args.shift();
    const query = args.join(" ");

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${event.senderID}.mp4`);

    api.sendMessage(
      `🎥 Video download হচ্ছে...\n🔎 ${query}\n⏳ একটু অপেক্ষা করো`,
      event.threadID
    );

    const command = `
      yt-dlp "ytsearch1:${query}" \
      -f "mp4[filesize_approx<=25M]/mp4" \
      --merge-output-format mp4 \
      --no-playlist \
      -o "${filePath}"
    `;

    exec(command, (err) => {
      if (err || !fs.existsSync(filePath)) {
        console.error(err);
        return api.sendMessage(
          "❌ | Video download fail হয়েছে",
          event.threadID
        );
      }

      if (fs.statSync(filePath).size > 25 * 1024 * 1024) {
        fs.unlinkSync(filePath);
        return api.sendMessage(
          "❌ | ভিডিও 25MB এর বেশি",
          event.threadID
        );
      }

      api.sendMessage(
        {
          body: `🎬 ${query}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });
  }
};
