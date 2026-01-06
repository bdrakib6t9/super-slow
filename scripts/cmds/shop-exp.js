const utils = require("../../utils.js");

const EXP_SHOP = [
  { exp: 100, price: "10k" },
  { exp: 500, price: "45k" },
  { exp: 1000, price: "80k" },
  { exp: 5000, price: "350k" }
];

module.exports = {
  config: {
    name: "shop-exp",
    aliases: ["shopexp"],
    role: 0,
    category: "shop"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    let wallet = BigInt(user.money || 0);
    let exp = Number(user.exp || 0);

    if (!args[0]) {
      let msg = "📘 **EXP SHOP**\n\n";
      EXP_SHOP.forEach((i, idx) => {
        msg += `${idx + 1}. +${i.exp} EXP → ${i.price}\n`;
      });
      msg += "\nUse: shopexp <number>";
      return message.reply(msg);
    }

    const index = parseInt(args[0]) - 1;
    if (!EXP_SHOP[index])
      return message.reply("❌ Invalid item.");

    const item = EXP_SHOP[index];
    const price = utils.parseAmount(item.price, "wallet", wallet, 0, 0);

    if (wallet < price)
      return message.reply("❌ Not enough balance.");

    wallet -= price;
    exp += item.exp;

    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      exp
    });

    return message.reply(
      `✅ EXP Purchased!\n\n` +
      `📘 +${item.exp} EXP\n` +
      `💸 Cost: ${item.price}\n` +
      `🏦 Balance: ${utils.formatMoney(wallet)}`
    );
  }
};
