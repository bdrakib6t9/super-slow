const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "love",
    aliases: ["lve"],
    version: "5.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Propose with custom image",
    longDescription: "Generate a propose image with avatars perfectly placed.",
    category: "fun",
    guide: "{pn} @mention OR reply"
  },

  onStart: async function ({ message, event, usersData }) {

    let mentionedID;

    // ✅ Priority 1: Reply করলে
    if (event.type === "message_reply") {
      mentionedID = event.messageReply.senderID;
    }

    // ✅ Priority 2: Mention করলে
    else if (Object.keys(event.mentions || {}).length > 0) {
      mentionedID = Object.keys(event.mentions)[0];
    }

    if (!mentionedID)
      return message.reply("❗ কাউকে mention করো অথবা কারো মেসেজে reply দাও।");

    const senderID = event.senderID;

    try {

      // 👤 Name
      const nameSender = await usersData.getName(senderID).catch(() => "User");
      const nameMentioned = await usersData.getName(mentionedID).catch(() => "User");

      // 🖼 Avatar
      const avatarPathSender = await getAvatarUrl(senderID).catch(() => null);
      const avatarPathMentioned = await getAvatarUrl(mentionedID).catch(() => null);

      if (!avatarPathSender || !avatarPathMentioned)
        return message.reply("❌ Avatar পাওয়া যায়নি।");

      // 🌄 Background
      const bgURL = "https://drive.google.com/uc?export=download&id=1gEgniSo0kRqB7iiFYEMP_o_0hbrO4nYy";
      const bgStream = await getStreamFromURL(bgURL);
      const bgBuffer = await streamToBuffer(bgStream);

      const [avatarSender, avatarMentioned, bg] = await Promise.all([
        Canvas.loadImage(avatarPathSender),
        Canvas.loadImage(avatarPathMentioned),
        Canvas.loadImage(bgBuffer)
      ]);

      // 🎨 Canvas
      const width = 1280;
      const height = 1280;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, width, height);

      const avatarSize = Math.floor(width * 0.11);

      const girlHead = { x: 470, y: 310 };
      const boyHead = { x: 690, y: 200 };

      // 💙 Mentioned
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        girlHead.x + avatarSize / 2,
        girlHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarMentioned, girlHead.x, girlHead.y, avatarSize, avatarSize);
      ctx.restore();

      // ❤️ Sender
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        boyHead.x + avatarSize / 2,
        boyHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarSender, boyHead.x, boyHead.y, avatarSize, avatarSize);
      ctx.restore();

      // 📂 Temp folder
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(tmpDir, `${senderID}_${mentionedID}_love.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      const text =
        senderID === mentionedID
          ? "নিজেকে নিজেই বিয়ে করবে নাকি? 😂❤️"
          : `💍 ${nameSender} এর বিয়ে ${nameMentioned} এর সাথে 🥰❤️`;

      await message.reply(
        {
          body: text,
          attachment: fs.createReadStream(imgPath)
        },
        () => fs.unlink(imgPath).catch(() => {})
      );

      canvas.width = canvas.height = 0;
      global.gc && global.gc();

    } catch (err) {
      console.error("❌ Error in love command:", err);
      message.reply(`⚠️ কোনো সমস্যা হয়েছে!\n${err.message}`);
    }
  }
};

// 🔧 Stream → Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
        }
