const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "miabby",
    aliases: ["mia"],
    author: "Otineeeeyyyy (updated)",
    countDown: 5,
    role: 0,
    category: "fun",
  },

  wrapText: async (ctx, text, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);

      const words = text.split(" ");
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

        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
          line += `${words.shift()} `;
        } else {
          lines.push(line.trim());
          line = "";
        }

        if (words.length === 0) lines.push(line.trim());
      }
      resolve(lines);
    });
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    const text = args.join(" ");
    if (!text) {
      return api.sendMessage("✏️ Enter some text!", threadID, messageID);
    }

    // ✅ Google Drive direct image link
    const imageURL =
      "https://drive.google.com/uc?export=download&id=1D7Xx1rW0f4t7OUz6nGBc6-KTKHlXc52j";

    const pathImg = __dirname + "/cache/mia.png";

    try {
      const res = await axios.get(imageURL, { responseType: "arraybuffer" });
      fs.writeFileSync(pathImg, Buffer.from(res.data));
    } catch (err) {
      return api.sendMessage("❌ Failed to download image!", threadID, messageID);
    }

    const baseImage = await loadImage(pathImg);
    const canvasImg = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvasImg.getContext("2d");

    // Draw background
    ctx.drawImage(baseImage, 0, 0, canvasImg.width, canvasImg.height);

    // Text style
    ctx.font = "300 32px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";

    const lines = await this.wrapText(ctx, text, 600);

    // Text position
    const startY = 160;
    ctx.fillText(lines.join("\n"), 50, startY);

    // Save final image
    fs.writeFileSync(pathImg, canvasImg.toBuffer());

    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  },
};
