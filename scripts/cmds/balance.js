const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "3.1",
    author: "NTKhang + Rakib",
    countDown: 5,
    role: 0,
    description: {
      en: "View wallet, bank and loan with infinite formatted numbers",
      bn: "Wallet, Bank, Loan ইনফিনিট suffix ফরম্যাটে দেখাবে"
    },
    category: "economy"
  },

  langs: {
    en: {
      money:
        "💳 Your balance:\n" +
        "💼 Bal: %1\n" +
        "🏦 Bank: %2\n" +
        "💸 Loan: %3",

      moneyOf:
        "💳 Balance of %1:\n" +
        "💼 Bal: %2\n" +
        "🏦 Bank: %3\n" +
        "💸 Loan: %4"
    },
    bn: {
      money:
        "💳 তোমার ব্যালেন্স:\n" +
        "💼 Bal: %1\n" +
        "🏦 Bank: %2\n" +
        "💸 Loan: %3",

      moneyOf:
        "💳 %1 এর ব্যালেন্স:\n" +
        "💼 Bal: %2\n" +
        "🏦 Bank: %3\n" +
        "💸 Loan: %4"
    }
  },

  onStart: async function ({ message, usersData, event, getLang }) {

    const getUserBalances = async (uid) => {
      const userData = await usersData.get(uid) || {};
      return {
        wallet: userData.money ?? "0",
        bank: userData.data?.bank ?? "0",
        loan: userData.data?.loan ?? "0",
        name: userData.name || "Unknown"
      };
    };

    // ===== REPLY USER =====
    if (event.messageReply) {
      const uid = event.messageReply.senderID;
      const { wallet, bank, loan, name } = await getUserBalances(uid);

      return message.reply(
        getLang(
          "moneyOf",
          name,
          utils.formatMoney(wallet),
          utils.formatMoney(bank),
          utils.formatMoney(loan)
        )
      );
    }

    // ===== MENTION USERS =====
    if (Object.keys(event.mentions).length > 0) {
      let msg = "";

      for (const uid of Object.keys(event.mentions)) {
        const { wallet, bank, loan } = await getUserBalances(uid);
        const cleanName = event.mentions[uid].replace("@", "");

        msg += getLang(
          "moneyOf",
          cleanName,
          utils.formatMoney(wallet),
          utils.formatMoney(bank),
          utils.formatMoney(loan)
        ) + "\n\n";
      }

      return message.reply(msg.trim());
    }

    // ===== SELF =====
    const { wallet, bank, loan } =
      await getUserBalances(event.senderID);

    return message.reply(
      getLang(
        "money",
        utils.formatMoney(wallet),
        utils.formatMoney(bank),
        utils.formatMoney(loan)
      )
    );
  }
};
