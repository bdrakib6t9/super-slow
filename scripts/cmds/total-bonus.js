const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "total-bonus",
    aliases: ["tb"],
    version: "4.0",
    author: "Rakib",
    role: 0,
    category: "owner",
    description: {
      en: "Owner unlimited bonus (fully safe, no limit, no zero bug)",
      bn: "Owner এর জন্য আনলিমিটেড বোনাস (সম্পূর্ণ সেফ)"
    },
    guide: {
      en: "tb <money> <exp>",
      bn: "tb <money> <exp>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {

    /* ===== OWNER UID ===== */
    const OWNER_UID = "61581351693349";
    if (event.senderID !== OWNER_UID)
      return message.reply("❌ This command is owner-only.");

    const moneyArg = args[0];
    const expArg = args[1];

    if (!moneyArg && !expArg)
      return message.reply("⚠️ Usage: tb <money> <exp>");

    const user = await usersData.get(OWNER_UID) || {};
    const data = user.data || {};

    /* ===== LOAD BALANCE (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== PARSE MONEY (🔥 NO LIMIT, NO REGEX) ===== */
    let moneyAdd = 0n;
    if (moneyArg) {
      moneyAdd = utils.parseAmount(
        moneyArg,
        "wallet",
        wallet,
        bank,
        0n
      );

      if (!moneyAdd || typeof moneyAdd !== "bigint" || moneyAdd <= 0n)
        return message.reply("❌ Invalid money amount.");
    }

    /* ===== PARSE EXP ===== */
    let expAdd = 0;
    if (expArg) {
      expAdd = parseInt(expArg);
      if (isNaN(expAdd) || expAdd < 0)
        return message.reply("❌ Invalid EXP amount.");
    }

    /* ===== APPLY MONEY ===== */
    wallet += moneyAdd;

    /* ===== AUTO BANK LIMIT (150cs SYSTEM) ===== */
    const fixed = utils.applyWalletLimit(wallet, bank);
    wallet = fixed.wallet;
    bank   = fixed.bank;

    /* ===== APPLY EXP ===== */
    const newExp = (user.exp || 0) + expAdd;

    /* ===== SAVE ===== */
    await usersData.set(OWNER_UID, {
      ...user,
      money: wallet.toString(),
      exp: newExp,
      data: {
        ...data,
        bank: bank.toString()
      }
    });

    /* ===== OUTPUT ===== */
    return message.reply(
      "🎁 **TOTAL BONUS SUCCESS!**\n\n" +
      `💰 Balance Added: ${utils.formatMoney(moneyAdd)}\n` +
      `⭐ EXP Added: ${expAdd}\n\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}\n` +
      `📊 EXP: ${newExp}`
    );
  }
};
