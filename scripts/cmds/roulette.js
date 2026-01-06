const utils = require("../../utils.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RED_NUMBERS = [
  1,3,5,7,9,12,14,16,18,
  19,21,23,25,27,30,32,34,36
];

module.exports = {
  config: {
    name: "roulette",
    aliases: ["rol"],
    version: "2.1",
    author: "Rakib",
    role: 0,
    category: "economy",
    description: {
      en: "Casino Roulette game (VIP supported)",
      bn: "VIP বোনাসসহ রুলেট গেম"
    },
    guide: {
      en: "rol <bet> <red|black|odd|even|number> [value]",
      bn: "rol <bet> <red|black|odd|even|number> [value]"
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
    if (now - (data.lastRoulette || 0) < 10_000)
      return message.reply("⏳ Please wait before playing again.");

    /* ===== LOAD BALANCES (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== PARSE BET ===== */
    const bet = utils.parseAmount(
      args[0],
      "wallet",
      wallet,
      bank,
      0n
    );

    const type = (args[1] || "").toLowerCase();
    const chosen =
      args[2] !== undefined ? parseInt(args[2]) : null;

    if (!bet || typeof bet !== "bigint" || bet <= 0n)
      return message.reply("❌ Invalid bet amount.");

    if (wallet < bet)
      return message.reply("❌ Not enough balance.");

    if (!["red","black","odd","even","number"].includes(type))
      return message.reply("❌ Invalid bet type.");

    if (type === "number" &&
        (isNaN(chosen) || chosen < 0 || chosen > 36))
      return message.reply("❌ Number must be 0–36.");

    /* ===== SPIN ===== */
    const sent = await message.reply("🎯 Spinning roulette...");
    await sleep(900);

    const result = Math.floor(Math.random() * 37);
    const color =
      result === 0 ? "green" :
      RED_NUMBERS.includes(result) ? "red" : "black";

    let win = false;
    let multiplier = 0n;

    if (type === "number" && result === chosen) {
      win = true;
      multiplier = 36n;
    }
    else if (
      (type === "red"   && color === "red")   ||
      (type === "black" && color === "black") ||
      (type === "odd"   && result % 2 === 1)  ||
      (type === "even"  && result !== 0 && result % 2 === 0)
    ) {
      win = true;
      multiplier = 2n;
    }

    /* ===== RESULT ===== */
    let profit = -bet;
    let resultText = "";

    const rouletteStats =
      data.rouletteStats || { win: "0", lose: "0" };

    if (win) {
      const vipBonus = isVIP ? 120n : 100n; // %
      const payout =
        (bet * multiplier * vipBonus) / 100n;

      wallet += payout;
      profit = payout;

      rouletteStats.win =
        (utils.safeBigInt(rouletteStats.win) + payout).toString();

      resultText =
        `🎉 YOU WIN!\n` +
        `🎯 Multiplier: x${multiplier}` +
        (isVIP ? "\n👑 VIP Bonus: +20%" : "");
    }
    else {
      wallet -= bet;

      rouletteStats.lose =
        (utils.safeBigInt(rouletteStats.lose) + bet).toString();

      resultText = "💀 YOU LOSE!";
    }

    /* ===== AUTO BANK LIMIT (150cs SYSTEM) ===== */
    const fixed = utils.applyWalletLimit(wallet, bank);
    wallet = fixed.wallet;
    bank   = fixed.bank;

    /* ===== SAVE USER ===== */
    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        bank: bank.toString(),
        lastRoulette: now,
        rouletteStats
      }
    });

    /* ===== FINAL MESSAGE ===== */
    let out =
      `🎯 ROULETTE RESULT\n\n` +
      `👤 Player: ${name}\n` +
      `🎰 Landed: ${result} (${color})\n\n` +
      `${resultText}\n\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n`;

    if (profit > 0n)
      out += `💰 Win: +${utils.formatMoney(profit)}\n`;
    else
      out += `💸 Loss: -${utils.formatMoney(-profit)}\n`;

    out +=
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`;

    api.editMessage(out, sent.messageID);
  }
};
