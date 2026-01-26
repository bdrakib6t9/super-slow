const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "married",
    aliases: ["mrd"],
    version: "2.0",
    author: "LEARN TO EAT LEARN TO SPEAK BUT DON'T TRY TO CHANGE THE CREDIT AKASH",
    countDown: 5,
    role: 0,
    shortDescription: "get married",
    longDescription: "mention your love",
    category: "love",
    guide: "{pn} @mention"
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) {
      return message.reply("❌ Please mention someone ❗");
    }

    let one, two;
    if (mention.length === 1) {
      one = event.senderID;
      two = mention[0];
    } else {
      one = mention[1];
      two = mention[0];
    }

    const path = await makeMarriedImage(one, two);

    return message.reply({
      body: getRandomMarriedText(),
      attachment: fs.createReadStream(path)
    });
  }
};

// ---------------- IMAGE PART ----------------

async function makeMarriedImage(one, two) {
  const bgURL =
    "https://drive.google.com/uc?export=download&id=1Y4r9ONma3I44TNqLTVQBN-znDyv9j3Mx";

  let avone = await jimp.read(
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avone.circle();

  let avtwo = await jimp.read(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avtwo.circle();

  let img = await jimp.read(bgURL);

  // keep original layout feel
  img
    .resize(1024, 684)
    .composite(avone.resize(85, 85), 204, 160)
    .composite(avtwo.resize(80, 80), 315, 105);

  const outPath = `married_${Date.now()}.png`;
  await img.writeAsync(outPath);
  return outPath;
}

// ---------------- RANDOM TEXT ----------------

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
