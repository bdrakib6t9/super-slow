const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "love",
    aliases: ["lve"],
    version: "4.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Propose with custom image",
    longDescription: "Generate a propose image with avatars perfectly placed.",
    category: "fun",
    guide: "{pn} @mention"
  },

  onStart: async function ({ message, event, usersData }) {

    const mention = Object.keys(event.mentions || {});
    if (mention.length === 0)
      return message.reply("❗ দয়া করে কাউকে mention করো।");

    const senderID = event.senderID;
    const mentionedID = mention[0];

    try {
      // 👤 Names
      const nameSender = await usersData.getName(senderID).catch(() => "User");
      const nameMentioned = await usersData.getName(mentionedID).catch(() => "User");

      // 🖼️ Local avatar path
      const avatarPathSender = await getAvatarUrl(senderID).catch(() => null);
      const avatarPathMentioned = await getAvatarUrl(mentionedID).catch(() => null);

      if (!avatarPathSender || !avatarPathMentioned)
        return message.reply("❌ Avatar পাওয়া যায়নি।");

      // 🌄 Background (Google Drive direct)
      const bgURL =
        "https://drive.google.com/uc?export=download&id=1gEgniSo0kRqB7iiFYEMP_o_0hbrO4nYy";

      const bgStream = await getStreamFromURL(bgURL);
      const bgBuffer = await streamToBuffer(bgStream);

      // Load images
      const [avatarImgSender, avatarImgMentioned, bg] = await Promise.all([
        Canvas.loadImage(avatarPathSender),
        Canvas.loadImage(avatarPathMentioned),
        Canvas.loadImage(bgBuffer)
      ]);

      // 🎨 Canvas setup
      const canvasWidth = 1280;
      const canvasHeight = 1280;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      // Avatar size & position
      const avatarSize = Math.floor(canvasWidth * 0.11);
      const girlHead = { x: 470, y: 310 };
      const boyHead = { x: 690, y: 200 };

      // 💙 Mentioned (left)
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        girlHead.x + avatarSize / 2,
        girlHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(
        avatarImgMentioned,
        girlHead.x,
        girlHead.y,
        avatarSize,
        avatarSize
      );
      ctx.restore();

      // ❤️ Sender (right)
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        boyHead.x + avatarSize / 2,
        boyHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(
        avatarImgSender,
        boyHead.x,
        boyHead.y,
        avatarSize,
        avatarSize
      );
      ctx.restore();

      // 💾 Save image
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(
        tmpDir,
        `${senderID}_${mentionedID}_marry.png`
      );

      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      // 💬 Text
      const text =
        senderID === mentionedID
          ? "নিজেকে নিজেকে বিয়ে করবে ? 😂❤️"
          : `💍 ${nameSender} এর বিয়ে ${nameMentioned} এর সাথে 🥰❤️`;

      await message.reply(
        {
          body: text,
          attachment: fs.createReadStream(imgPath)
        },
        () => fs.unlink(imgPath).catch(() => {})
      );

      // 🧹 memory clean
      canvas.width = canvas.height = 0;
      global.gc && global.gc();

    } catch (err) {
      console.error("❌ Error in marry command:", err);
      message.reply(`⚠️ কোনো সমস্যা হয়েছে!\n${err.message}`);
    }
  }
};

// helper
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
    }
