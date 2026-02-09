const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "hack",
    author: "Rakib",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Generates a 'hacking' image (mention or reply)"
    }
  },

  wrapText: async (ctx, name, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(name).width < maxWidth) return resolve([name]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);

      const words = name.split(" ");
      const lines = [];
      let line = "";

      while (words.length > 0) {
        let split = false;

        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }

        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
          line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }

        if (words.length === 0) lines.push(line.trim());
      }

      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, usersData }) {
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const pathImg = path.join(tmpDir, `hack_${Date.now()}.png`);

    // ✅ target user (mention OR reply OR self)
    let targetID = Object.keys(event.mentions || {})[0];
    if (!targetID && event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    if (!targetID) {
      targetID = event.senderID;
    }

    // user name
    const name = await usersData.getName(targetID).catch(() => "Unknown User");

    // 🔥 background
    const backgroundURL =
      "https://drive.google.com/uc?export=download&id=1pJgY4FAl1vwKs7eq9MPRVykFscZ6Mvjx";

    // load background
    const bgStream = await getStreamFromURL(backgroundURL);
    const bgBuffer = await streamToBuffer(bgStream);
    const baseImage = await loadImage(bgBuffer);

    // 🔥 avatar (local cached path)
    let avatar;
    try {
      const avatarPath = await getAvatarUrl(targetID);
      avatar = await loadImage(avatarPath);
    } catch {
      avatar = null;
    }

    // canvas setup
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // text
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    const lines = await this.wrapText(ctx, name, 1160);
    if (lines) ctx.fillText(lines.join("\n"), 200, 497);

    // avatar position
    if (avatar) {
      ctx.drawImage(avatar, 83, 437, 100, 101);
    }

    // export
    fs.writeFileSync(pathImg, canvas.toBuffer());

    return api.sendMessage(
      {
        body: "✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮 𝙃𝙖𝙘𝙠𝙚𝙙 𝙏𝙝𝙞𝙨 𝙐𝙨𝙚𝙧! 💻",
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  }
};

/* ========== HELPERS ========== */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
      }
