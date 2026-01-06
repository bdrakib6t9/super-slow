const utils = require("../../utils.js");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DICE = ["⚀","⚁","⚂","⚃","⚄","⚅"];

module.exports = {
  config: {
    name: "dice",
    aliases: ["roll"],
    version: "2.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};
    const name = user.name || "Unknown";

    /* ===== COOLDOWN ===== */
    const now = Date.now();
    if (now - (data.lastDiceTime || 0) < 8000)
      return message.reply("⏳ Please wait before rolling again.");

    /* ===== LOAD BALANCES (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== BET ===== */
    const bet = utils.parseAmount(
      args[0],
      "wallet",
      wallet,
      bank,
      0n
    );

    if (!bet || typeof bet !== "bigint" || bet <= 0n)
      return message.reply("❌ Invalid bet amount.");

    if (wallet < bet)
      return message.reply("❌ You don't have enough balance.");

    /* ===== ROLL ===== */
    const playerRoll = Math.floor(Math.random() * 6) + 1;
    const houseRoll  = Math.floor(Math.random() * 6) + 1;

    let profit = 0n;
    let title = "💀 YOU LOST!";
    let resultLine = "";

    if (playerRoll > houseRoll) {
      profit = bet;
      wallet += bet;
      title = "🎉 YOU WON!";
      resultLine = `💰 Win: +${utils.formatMoney(bet)}`;
    }
    else if (playerRoll === houseRoll) {
      profit = 0n;
      title = "😐 DRAW!";
      resultLine = "➖ No win, no loss";
    }
    else {
      profit = -bet;
      wallet -= bet;
      resultLine = `💸 Loss: -${utils.formatMoney(bet)}`;
    }

    /* ===== AUTO BANK LIMIT (150cs) ===== */
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
        lastDiceTime: now,

        // stats
        dicePlayed: (data.dicePlayed || 0) + 1,
        diceWin: (
          utils.safeBigInt(data.diceWin) +
          (profit > 0n ? profit : 0n)
        ).toString()
      }
    });

    /* ===== INITIAL MESSAGE ===== */
    const sent = await message.reply(
      `🎲 ⚀ vs ⚀\n` +
      `✨ Rolling the dice...\n\n` +
      `👤 Player: ${name}\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`
    );

    /* ===== ANIMATION (MAX 4 EDITS) ===== */
    for (let i = 0; i < 3; i++) {
      await sleep(400);
      api.editMessage(
        `🎲 ${DICE[Math.floor(Math.random()*6)]} vs ${DICE[Math.floor(Math.random()*6)]}\n` +
        `✨ Rolling the dice...\n\n` +
        `👤 Player: ${name}\n` +
        `💵 Bet: ${utils.formatMoney(bet)}\n` +
        `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
        `🏦 Bank: ${utils.formatMoney(bank)}`,
        sent.messageID
      );
    }

    /* ===== FINAL RESULT ===== */
    await sleep(500);
    api.editMessage(
      `🎲 ${DICE[playerRoll-1]} vs ${DICE[houseRoll-1]}\n` +
      `${resultLine}\n\n` +
      `${title}\n\n` +
      `👤 Player: ${name}\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`,
      sent.messageID
    );
  }
};
