const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "fix-balance",
    aliases: ["fixbal", "resetbal"],
    version: "1.0",
    author: "Rakib",
    role: 2, // ⚠️ ADMIN ONLY
    category: "admin",
    guide: {
      en: "fix-balance @user (or reply)",
      bn: "fix-balance @user (অথবা রিপ্লাই)"
    }
  },

  onStart: async function ({ message, event, usersData }) {

    // ===== GET TARGET USER =====
    let targetID;

    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }
    else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    else {
      return message.reply("❌ Mention a user or reply to a message.");
    }

    const user = await usersData.get(targetID) || {};
    const data = user.data || {};

    // ===== SANITIZE VALUES =====
    const wallet = utils.safeBigInt(user.money);
    const bank = utils.safeBigInt(data.bank);
    const loan = utils.safeBigInt(data.loan);

    // ===== SAVE CLEAN DATA =====
    await usersData.set(targetID, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        bank: bank.toString(),
        loan: loan.toString()
      }
    });

    return message.reply(
      "✅ **Balance Fixed Successfully!**\n\n" +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}\n` +
      `💸 Loan: ${utils.formatMoney(loan)}`
    );
  }
};
