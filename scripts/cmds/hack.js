const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "hack",
    author: "Rakib",
    countDown: 5,
    role: 2,
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

  onStart: async function ({ api, event }) {
    const pathImg = __dirname + "/tmp/hack_bg.png";
    const pathAvt = __dirname + "/tmp/hack_avt.png";

    // ✅ target user (mention OR reply OR self)
    let targetID = Object.keys(event.mentions || {})[0];
    if (!targetID && event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    if (!targetID) {
      targetID = event.senderID;
    }

    // user info
    const userInfo = await api.getUserInfo(targetID);
    const name = userInfo[targetID].name;

    // 🔥 background
    const backgroundURL =
      "https://drive.google.com/uc?export=download&id=1pJgY4FAl1vwKs7eq9MPRVykFscZ6Mvjx";

    // avatar
    const avatarData = (
      await axios.get(
        `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;

    fs.writeFileSync(pathAvt, Buffer.from(avatarData));

    // background data
    const bgData = (
      await axios.get(backgroundURL, { responseType: "arraybuffer" })
    ).data;

    fs.writeFileSync(pathImg, Buffer.from(bgData));

    // canvas setup
    const baseImage = await loadImage(pathImg);
    const avatar = await loadImage(pathAvt);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // text
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    const lines = await this.wrapText(ctx, name, 1160);
    ctx.fillText(lines.join("\n"), 200, 497);

    // avatar position
    ctx.drawImage(avatar, 83, 437, 100, 101);

    // export
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt);

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
