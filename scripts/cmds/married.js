const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "married",
    aliases: ["mrd"],
    version: "2.2",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "get married",
    longDescription: "mention or reply your love",
    category: "love",
    guide: "{pn} @mention | reply + {pn}"
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
      return message.reply("❌ Please mention or reply to someone ❗");
    }

    let one = senderID;
    let two = targetID;

    // old behaviour if 2 mentions
    const mentions = Object.keys(event.mentions || {});
    if (mentions.length >= 2) {
      one = mentions[1];
      two = mentions[0];
    }

    const imgPath = await makeMarriedImage(one, two);

    return message.reply(
      {
        body: getRandomMarriedText(),
        attachment: fs.createReadStream(imgPath)
      },
      () => fs.unlinkSync(imgPath)
    );
  }
};

/* ================= IMAGE PART ================= */

async function makeMarriedImage(one, two) {
  const bgURL =
    "https://drive.google.com/uc?export=download&id=1Y4r9ONma3I44TNqLTVQBN-znDyv9j3Mx";

  // avatar paths (local cache)
  const avatarPath1 = await getAvatarUrl(one).catch(() => null);
  const avatarPath2 = await getAvatarUrl(two).catch(() => null);

  const avone = await loadAvatar(avatarPath1, "A");
  const avtwo = await loadAvatar(avatarPath2, "B");

  avone.circle();
  avtwo.circle();

  // background
  const bgStream = await getStreamFromURL(bgURL);
  const bgBuffer = await streamToBuffer(bgStream);
  const img = await Jimp.read(bgBuffer);

  // keep original layout feel
  img
    .resize(1024, 684)
    .composite(avone.resize(85, 85), 204, 160)
    .composite(avtwo.resize(80, 80), 315, 105);

  const outPath = path.join(__dirname, `married_${Date.now()}.png`);
  await img.writeAsync(outPath);
  return outPath;
}

/* ================= HELPERS ================= */

async function loadAvatar(localPath, fallbackChar) {
  try {
    if (localPath && fs.existsSync(localPath)) {
      return await Jimp.read(localPath);
    }
  } catch {}

  // placeholder fallback
  const img = new Jimp(100, 100, "#f5f5f5");
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  img.print(
    font,
    0,
    0,
    {
      text: fallbackChar,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    },
    100,
    100
  );
  return img;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/* ================= RANDOM TEXT ================= */

function getRandomMarriedText() {
  const texts = [
    "💍 Just got married! Wishing you a lifetime of love ❤️",
    "🎉 Officially married! May your love grow stronger every day 💖",
    "💑 Two hearts, one journey — married at last!",
    "🥰 Marriage unlocked! Happiness starts now 💍",
    "💞 Together forever — congratulations on your marriage!",
    "👰🤵 The wedding bells just rang! Stay blessed always 💐"
  ];

  return texts[Math.floor(Math.random() * texts.length)];
    }
