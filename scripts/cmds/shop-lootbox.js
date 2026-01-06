const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "shop-lootbox",
    aliases: ["shoplb"],
    role: 0,
    category: "shop",
    description: {
      en: "Buy lootbox with custom amount",
      bn: "নিজের পছন্দের দামে লুটবক্স কিনুন"
    },
    guide: {
      en: "shoplb <amount>",
      bn: "shoplb <amount>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};

    /* ===== LOAD BALANCE (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    if (!args[0])
      return message.reply("❌ Use: shoplb <amount>");

    /* ===== PARSE BET ===== */
    const bet = utils.parseAmount(
      args[0],
      "wallet",
      wallet,
      bank,
      0n
    );

    if (!bet || typeof bet !== "bigint" || bet <= 0n)
      return message.reply("❌ Invalid amount.");

    if (wallet < bet)
      return message.reply("❌ Not enough balance.");

    /* ======================
       SAFE LOOTBOX ROLL
    ====================== */

    // multiplier percent range (40% → 200%)
    const MIN = 40n;
    const MAX = 200n;

    const randomPercent =
      MIN + BigInt(
        Math.floor(
          Math.random() * Number(MAX - MIN + 1n)
        )
      );

    // reward = bet * percent / 100
    const reward = (bet * randomPercent) / 100n;

    /* ===== APPLY RESULT ===== */
    wallet = wallet - bet + reward;

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
        bank: bank.toString()
      }
    });

    /* ===== RESULT TEXT ===== */
    let resultText = "😐 EVEN!";
    if (reward > bet) resultText = "🎉 BIG WIN!";
    else if (reward < bet) resultText = "💀 LOSS!";

    return message.reply(
      `🎁 **LOOTBOX OPENED!**\n\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n` +
      `🎲 Multiplier: x${Number(randomPercent) / 100}\n` +
      `🎉 Reward: ${utils.formatMoney(reward)}\n` +
      `📊 Result: ${resultText}\n\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`
    );
  }
};
