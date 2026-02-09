const jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "us",
    aliases: ["uss"],
    version: "2.2",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "we together",
    longDescription: "Cute together image (mention or reply)",
    category: "love",
    guide: {
      en: "{pn} @tag | reply + {pn}"
    }
  },

  onStart: async function ({ message, event }) {
    const senderID = event.senderID;

    // ✅ target (mention OR reply)
    let targetID = Object.keys(event.mentions || {})[0];
    if (!targetID && event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    }

    // ❌ no target
    if (!targetID) {
      return message.reply("❌ Please mention or reply to someone.");
    }

    // decide order
    let one = senderID;
    let two = targetID;

    // if two mentions, keep old behavior
    const mentions = Object.keys(event.mentions || {});
    if (mentions.length >= 2) {
      one = mentions[1];
      two = mentions[0];
    }

    const outPath = await makeImage(one, two);

    return message.reply(
      {
        body: getRandomText(),
        attachment: fs.createReadStream(outPath)
      },
      () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }
    );
  }
};

// ---------------- IMAGE FUNCTION ----------------

async function makeImage(one, two) {
  const bgURL =
    "https://drive.google.com/uc?export=download&id=1bOW5kMqeU3VHHN1Hg1MCSIspNktzttvj";

  // -------- avatars (LOCAL CACHE) --------
  const pathOne = await getAvatarUrl(one).catch(() => null);
  const pathTwo = await getAvatarUrl(two).catch(() => null);

  const avone = await loadAvatar(pathOne);
  const avtwo = await loadAvatar(pathTwo);

  avone.circle();
  avtwo.circle();

  const img = await jimp.read(bgURL);

  img
    .resize(466, 659)
    .composite(avone.resize(110, 110), 150, 76)
    .composite(avtwo.resize(100, 100), 245, 305);

  const outPath = path.join(__dirname, `us_${Date.now()}.png`);
  await img.writeAsync(outPath);
  return outPath;
}

// ---------------- AVATAR LOADER ----------------

async function loadAvatar(localPath) {
  try {
    if (localPath && fs.existsSync(localPath)) {
      return await jimp.read(localPath);
    }
  } catch {}

  // fallback placeholder
  const img = new jimp(512, 512, "#777");
  return img;
}

// ---------------- RANDOM TEXT SYSTEM ----------------

function getRandomText() {
  const texts = [
    "ভয় পাওয়ার কিছু নেই 🫶 আমি আছি তো ❤️",
    "Just you and me 💞 no fear at all.",
    "সব ঠিক হয়ে যাবে, আমরা একসাথে আছি 🌸",
    "Don't worry 😊 I'm right here with you.",
    "হাতটা ধরো ✨ বাকি সব আমি সামলে নেব",
    "Together we are stronger 💖 always."
  ];

  return texts[Math.floor(Math.random() * texts.length)];
      }
