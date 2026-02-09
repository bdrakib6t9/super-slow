const fs = require("fs");
const Jimp = require("jimp");
const { Readable } = require("stream");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "tus",
    version: "3.1",
    author: "Rakib",
    category: "fun",
    guide: "{prefix}tus @mention বা কাউকে reply দিন"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;

      // -------------------------
      // TARGET (reply > mention)
      // -------------------------
      let targetID = null;
      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      if (!targetID) {
        return message.reply("❌ কাউকে reply বা mention করলে তবেই tus কাজ করবে।");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      const threadData = await threadsData.get(event.threadID);
      const members = threadData?.members || [];

      const senderInfo = members.find(m => String(m.userID) === String(senderID));
      const targetInfo = members.find(m => String(m.userID) === String(targetID));

      const name1 = await usersData.getName(senderID).catch(() => senderInfo?.name || "User1");
      const name2 = await usersData.getName(targetID).catch(() => targetInfo?.name || "User2");

      // -------------------------
      // AVATAR (DPF STYLE - LOCAL FILE)
      // -------------------------
      const avatarPath1 = await getAvatarUrl(senderID).catch(() => null);
      const avatarPath2 = await getAvatarUrl(targetID).catch(() => null);

      // -------------------------
      // RANDOM TEXT
      // -------------------------
      const bnTexts = [
        "এই নাও 😎 তোমাকে টুস করে দিলাম!",
        "এইটা ধর 🫢 টুস খাইয়া হুশে আয়!",
        "টুস! 😂 এবার সামলাইস নিজেকে",
        "এই নাও ভাই 😆 স্পেশাল টুস!",
        "টুস করে দিলাম 😜 আর কিছু বলবো না"
      ];

      const enTexts = [
        "Here you go 😄 I just gave you a Tus!",
        "Boom! 💥 You just got a Tus!",
        "Tus delivered 😜 handle with care!",
        "Oops 😆 looks like you got a Tus!",
        "There you go 😉 freshly served Tus!"
      ];

      const useBangla = Math.random() < 0.5;
      const selectedText = useBangla
        ? bnTexts[Math.floor(Math.random() * bnTexts.length)]
        : enTexts[Math.floor(Math.random() * enTexts.length)];

      // -------------------------
      // IMAGE HELPERS
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      function placeholder(name) {
        const img = new Jimp(100, 100, "#888");
        const letter = (String(name)[0] || "U").toUpperCase();
        return Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(font => {
          img.print(
            font,
            0,
            0,
            {
              text: letter,
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            100,
            100
          );
          return img;
        });
      }

      async function loadAvatar(path, fallbackName) {
        try {
          if (!path || !fs.existsSync(path)) {
            return await placeholder(fallbackName);
          }
          return await Jimp.read(path);
        } catch {
          return await placeholder(fallbackName);
        }
      }

      // -------------------------
      // LOAD BACKGROUND
      // -------------------------
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/tus.jpg",
        "https://i.postimg.cc/zGz8mH43/tus.jpg"
      ];

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          break;
        } catch {}
      }

      if (!bgBuffer) {
        return message.reply("❌ tus background লোড করা যায়নি।");
      }

      const bg = await Jimp.read(bgBuffer);

      // -------------------------
      // LOAD AVATARS
      // -------------------------
      let img1 = await loadAvatar(avatarPath1, name1);
      let img2 = await loadAvatar(avatarPath2, name2);

      img1 = img1.resize(100, 100).circle();
      img2 = img2.resize(100, 100).circle();

      bg.composite(img1, 75, 95);
      bg.composite(img2, 590, 95);

      // -------------------------
      // FINAL OUTPUT
      // -------------------------
      const outBuffer = await bg.getBufferAsync(Jimp.MIME_JPEG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "tus.jpg";

      return message.reply({
        body: `😎 ${name1} ➜ ${name2}\n\n${selectedText}`,
        attachment: imgStream
      });

    } catch (err) {
      console.error("tus command error:", err);
      return message.reply("❌ Tus command failed.");
    }
  }
};
