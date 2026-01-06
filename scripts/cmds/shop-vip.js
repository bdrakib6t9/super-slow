const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "shop-vip",
    aliases: ["shopvip"],
    role: 0,
    category: "shop"
  },

  onStart: async function ({ message, event, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};
    let wallet = BigInt(user.money || 0);

    if (data.vip)
      return message.reply("👑 You are already a VIP!");

    const PRICE = utils.parseAmount("1m", "wallet", wallet, 0, 0);

    if (wallet < PRICE)
      return message.reply("❌ Not enough balance for VIP.");

    wallet -= PRICE;

    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        vip: true,
        vipSince: Date.now()
      }
    });

    return message.reply(
      `👑 **VIP ACTIVATED!**\n\n` +
      `💸 Cost: 1m\n` +
      `✨ Benefits:\n` +
      `• Higher bet bonus\n` +
      `• VIP crash multiplier\n` +
      `• Future VIP-only games\n\n` +
      `🏦 Balance: ${utils.formatMoney(wallet)}`
    );
  }
};
