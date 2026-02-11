const utils = require("../../utils.js");
const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "owner-bonus",
    aliases: ["ob"],
    version: "4.2",
    author: "Rakib",
    role: 0,
    category: "owner",
    description: {
      en: "Owner daily bonus (unlimited suffix, auto-bank, zero-safe)",
      bn: "Owner এর জন্য দৈনিক বোনাস (আনলিমিটেড, auto-bank, সেফ)"
    },
    guide: {
      en: "ob <money> <exp>",
      bn: "ob <money> <exp>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {

    /* ===== OWNER CHECK (string-safe) ===== */
    if (!ownerUID.includes(String(event.senderID)))
      return message.reply("❌ This command is owner-only.");

    const OWNER_UID = String(event.senderID);

    const moneyArg = args[0];
    const expArg = args[1];

    if (!moneyArg && !expArg)
      return message.reply("⚠️ Usage: ob <money> <exp>");

    const user = await usersData.get(OWNER_UID) || {};
    const data = user.data || {};

    /* ===== DAILY COOLDOWN ===== */
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const last = data.lastOwnerBonus || 0;

    if (now - last < DAY) {
      const left = Math.ceil((DAY - (now - last)) / 3600000);
      return message.reply(`⏳ Already claimed. Try again in ${left} hour(s).`);
    }

    /* ===== LOAD BALANCE (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== PARSE MONEY ===== */
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

    /* ===== AUTO BANK LIMIT */
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
        bank: bank.toString(),
        lastOwnerBonus: now
      }
    });

    /* ===== OUTPUT ===== */
    return message.reply(
      "🎁 **OWNER BONUS CLAIMED!**\n\n" +
      `💰 Balance Added: ${utils.formatMoney(moneyAdd)}\n` +
      `⭐ EXP Added: ${expAdd}\n\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}\n` +
      `📊 EXP: ${newExp}`
    );
  }
};
