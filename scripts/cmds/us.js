const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "us",
    aliases: ["uss"],
    version: "2.1",
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
    if (!targetID && event.messageReply) {
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

    const path = await makeImage(one, two);

    return message.reply({
      body: getRandomText(),
      attachment: fs.createReadStream(path)
    }, () => fs.unlinkSync(path));
  }
};

// ---------------- IMAGE FUNCTION ----------------

async function makeImage(one, two) {
  const bgURL =
    "https://drive.google.com/uc?export=download&id=1bOW5kMqeU3VHHN1Hg1MCSIspNktzttvj";

  const avone = await jimp.read(
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avone.circle();

  const avtwo = await jimp.read(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avtwo.circle();

  const img = await jimp.read(bgURL);

  img.resize(466, 659)
    .composite(avone.resize(110, 110), 150, 76)
    .composite(avtwo.resize(100, 100), 245, 305);

  const outPath = `us_${Date.now()}.png`;
  await img.writeAsync(outPath);
  return outPath;
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
