const utils = require("../../utils.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GRID_SIZE = 25;

module.exports = {
  config: {
    name: "mines",
    aliases: ["mine"],
    version: "2.0",
    author: "Rakib",
    role: 0,
    category: "economy",
    description: {
      en: "Casino Mines game (VIP supported)",
      bn: "VIP বোনাসসহ ক্যাসিনো মাইনস গেম"
    },
    guide: {
      en: "mines <bet> <mines>",
      bn: "mines <bet> <mines>"
    }
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};
    const name = user.name || "Unknown";
    const isVIP = data.vip === true;

    /* ===== COOLDOWN ===== */
    const now = Date.now();
    if (now - (data.lastMines || 0) < 10_000)
      return message.reply("⏳ Please wait before playing again.");

    let wallet = BigInt(user.money || 0);

    /* ===== INPUT ===== */
    const bet = utils.parseAmount(args[0], "wallet", wallet, 0, 0);
    const minesCount = parseInt(args[1]);

    if (!bet || bet <= 0n || isNaN(minesCount))
      return message.reply("❌ Usage: mines <bet> <mines>");

    if (wallet < bet)
      return message.reply("❌ Not enough balance.");

    if (minesCount < 1 || minesCount > 10)
      return message.reply("❌ Mines must be between 1 and 10.");

    /* ===== GENERATE BOARD ===== */
    const tiles = Array(GRID_SIZE).fill("💎");
    let placed = 0;

    while (placed < minesCount) {
      const i = Math.floor(Math.random() * GRID_SIZE);
      if (tiles[i] !== "💣") {
        tiles[i] = "💣";
        placed++;
      }
    }

    /* ===== AUTO PICKS ===== */
    const maxSafe = GRID_SIZE - minesCount;
    const safeTarget = Math.min(
      Math.floor(Math.random() * 5) + 1,
      maxSafe
    );

    let exploded = false;
    let safeOpened = 0;

    const sent = await message.reply("💣 Mines game starting...");
    await sleep(600);

    for (let i = 0; i < safeTarget; i++) {
      const idx = Math.floor(Math.random() * GRID_SIZE);

      if (tiles[idx] === "💣") {
        exploded = true;
        break;
      }

      safeOpened++;

      api.editMessage(
        `💣 MINES GAME\n\n` +
        `👤 Player: ${name}\n` +
        `🔓 Safe tiles opened: ${safeOpened}\n` +
        `💥 Mines: ${minesCount}`,
        sent.messageID
      );

      await sleep(500);
    }

    /* ===== MULTIPLIER ===== */
    let multiplier = 1.0;
    if (!exploded) {
      if (safeOpened >= 5) multiplier = 5.0;
      else if (safeOpened === 4) multiplier = 3.0;
      else if (safeOpened === 3) multiplier = 2.0;
      else if (safeOpened === 2) multiplier = 1.5;
      else multiplier = 1.2;
    }

    /* ===== RESULT ===== */
    let profit = -bet;
    let resultText = "";

    const minesStats = data.minesStats || { win: "0", lose: "0" };

    if (exploded) {
      wallet -= bet;

      minesStats.lose =
        (BigInt(minesStats.lose) + bet).toString();

      resultText = "💥 BOOM! You hit a mine!";
    }
    else {
      const VIP_MULTIPLIER = isVIP ? 1.3 : 1.0;
      const rawWin =
        Number(bet) * multiplier * VIP_MULTIPLIER;

      const win = BigInt(Math.floor(rawWin));

      wallet += win;
      profit = win;

      minesStats.win =
        (BigInt(minesStats.win) + win).toString();

      resultText =
        `🎉 SAFE CASHOUT x${multiplier}` +
        (isVIP ? "\n👑 VIP Bonus: +30%" : "");
    }

    /* ===== SAVE USER ===== */
    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        lastMines: now,
        minesStats
      }
    });

    /* ===== FINAL MESSAGE ===== */
    let out =
      `💣 MINES RESULT\n\n` +
      `👤 Player: ${name}\n` +
      `💣 Mines: ${minesCount}\n` +
      `🔓 Safe tiles: ${safeOpened}\n\n` +
      `${resultText}\n\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n`;

    if (profit > 0n)
      out += `💰 Win: +${utils.formatMoney(profit)}\n`;
    else
      out += `💸 Loss: -${utils.formatMoney(-profit)}\n`;

    out += `🏦 New Balance: ${utils.formatMoney(wallet)}`;

    api.editMessage(out, sent.messageID);
  }
};
