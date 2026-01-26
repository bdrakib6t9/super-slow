const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "prs",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({
    api, event, threadsData, usersData
  }) {

    const { loadImage, createCanvas } = require("canvas");

    let pathImg = __dirname + "/assets/background.png";
    let pathAvt1 = __dirname + "/assets/any.png";
    let pathAvt2 = __dirname + "/assets/avatar.png";

    const id1 = event.senderID;
    const name1 = await usersData.getName(id1);

    const threadInfo = await api.getThreadInfo(event.threadID);
    const all = threadInfo.userInfo;

    let gender1;
    for (let c of all) {
      if (c.id == id1) gender1 = c.gender;
    }

    const botID = api.getCurrentUserID();
    let ungvien = [];

    if (gender1 == "FEMALE") {
      for (let u of all) {
        if (u.gender == "MALE" && u.id !== id1 && u.id !== botID) {
          ungvien.push(u.id);
        }
      }
    }
    else if (gender1 == "MALE") {
      for (let u of all) {
        if (u.gender == "FEMALE" && u.id !== id1 && u.id !== botID) {
          ungvien.push(u.id);
        }
      }
    }
    else {
      for (let u of all) {
        if (u.id !== id1 && u.id !== botID) {
          ungvien.push(u.id);
        }
      }
    }

    const id2 = ungvien[Math.floor(Math.random() * ungvien.length)];
    const name2 = await usersData.getName(id2);

    const rd1 = Math.floor(Math.random() * 100) + 1;
    const cc = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    const rd2 = cc[Math.floor(Math.random() * cc.length)];
    const djtme = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    const tile = djtme[Math.floor(Math.random() * djtme.length)];

    // 🔥 NEW BACKGROUND (Google Drive)
    const background =
      "https://drive.google.com/uc?export=download&id=19QEwghmb2jOmmqeFG-9ouAWYtQyHd0NF";

    // Avatar 1
    const avt1 = (
      await axios.get(
        `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1));

    // Avatar 2
    const avt2 = (
      await axios.get(
        `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2));

    // Background
    const bg = (
      await axios.get(background, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(bg));

    // Canvas
    const baseImage = await loadImage(pathImg);
    const baseAvt1 = await loadImage(pathAvt1);
    const baseAvt2 = await loadImage(pathAvt2);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage(
      {
        body:
`『💗』Congratulations ${name1}
『❤️』Your destiny matched you with ${name2}
『🔗』Love compatibility: ${tile}%`,
        mentions: [
          { tag: name2, id: id2 },
          { tag: name1, id: id1 }
        ],
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  }
};
