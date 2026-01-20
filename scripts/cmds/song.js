const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "song",
    version: "5.0",
    role: 0,
    author: "Rakib",
    cooldowns: 5,
    shortdescription: "Full song download (Render stable)",
    category: "music",
    usages: "{pn} song <music name>"
  },

  onStart: async ({ api, event }) => {
    const args = event.body.split(" ");
    if (args.length < 2) {
      return api.sendMessage(
        "❌ | ব্যবহার:\n song <গানের নাম>",
        event.threadID
      );
    }

    args.shift();
    const query = args.join(" ");

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${event.senderID}.mp3`);

    api.sendMessage(
      `🎧 Download হচ্ছে...\n🔎 ${query}\n⏳ একটু অপেক্ষা করো`,
      event.threadID
    );

    const command = `
      yt-dlp "ytsearch1:${query}" \
      -x --audio-format mp3 \
      --audio-quality 0 \
      --no-playlist \
      -o "${filePath}"
    `;

    exec(command, (err) => {
      if (err || !fs.existsSync(filePath)) {
        console.error(err);
        return api.sendMessage(
          "❌ | Download fail হয়েছে (YouTube block)",
          event.threadID
        );
      }

      if (fs.statSync(filePath).size > 25 * 1024 * 1024) {
        fs.unlinkSync(filePath);
        return api.sendMessage(
          "❌ | গানটি 25MB এর বেশি",
          event.threadID
        );
      }

      api.sendMessage(
        {
          body: `🎵 ${query}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });
  }
};
