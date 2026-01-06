const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "owner-game",
    aliases: ["og"],
    version: "1.2",
    author: "Rakib",
    role: 0,
    category: "owner",
    description: {
      en: "Owner game with 100% win rate and 1q% bonus",
      bn: "Owner এর জন্য গেম (১০০% জয়, 1q% বোনাস)"
    },
    guide: {
      en: "og <bet amount>",
      bn: "og <bet amount>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {

    /* ===== OWNER UID ===== */
    const OWNER_UID = "61581351693349";
    if (event.senderID !== OWNER_UID)
      return message.reply("❌ This command is owner-only.");

    /* ===== ARG CHECK ===== */
    const betArg = args[0];
    if (!betArg)
      return message.reply("⚠️ Usage: og <amount>");

    /* ===== LOAD USER ===== */
    const user = await usersData.get(OWNER_UID) || {};
    const data = user.data || {};

    /* ===== LOAD BALANCES (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== PARSE BET ===== */
    const bet = utils.parseAmount(
      betArg,
      "wallet",
      wallet,
      bank,
      0n
    );

    if (!bet || typeof bet !== "bigint" || bet <= 0n)
      return message.reply("❌ Invalid bet amount.");

    if (wallet < bet)
      return message.reply(
        `❌ Not enough balance.\nCurrent: ${utils.formatMoney(wallet)}`
      );

    /* ===== OWNER GAME LOGIC ===== */
    const WIN_RATE = 100; // always win
    const BONUS_MULTIPLIER = 10n ** 13n; // 🔥 1q% = x10^13

    const winAmount = bet * BONUS_MULTIPLIER;

    // add profit
    wallet += winAmount;

    /* ===== AUTO BANK LIMIT (150cs SYSTEM) ===== */
    const fixed = utils.applyWalletLimit(wallet, bank);
    wallet = fixed.wallet;
    bank   = fixed.bank;

    /* ===== SAVE USER ===== */
    await usersData.set(OWNER_UID, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        bank: bank.toString(),
        lastOwnerGame: Date.now()
      }
    });

    /* ===== OUTPUT ===== */
    return message.reply(
      "👑 **OWNER GAME — GUARANTEED WIN!** 👑\n\n" +
      `🎯 Win Rate: ${WIN_RATE}%\n` +
      `💥 Bonus: 1q% (×10¹³)\n\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n` +
      `💰 Profit: +${utils.formatMoney(winAmount)}\n\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}\n\n` +
      "🔥 Absolute power unlocked."
    );
  }
};
