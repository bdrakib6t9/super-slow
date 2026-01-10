const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "bank",
    aliases: ["vault"],
    version: "6.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  langs: {
    en: {
      status:
        "💳 Your balance:\n" +
        "💼 Wallet: %1\n" +
        "🏦 Bank: %2\n" +
        "💸 Loan: %3",

      invalidAmount: "❌ Invalid amount",
      notEnoughWallet: "❌ Not enough wallet balance",
      notEnoughBank: "❌ Not enough bank balance",
      loanLimit: "❌ Loan limit exceeded",
      noLoan: "❌ No active loan",

      walletFull:
        "🔒 Wallet ভর্তি হয়ে গেছে!\n" +
        "💼 সর্বোচ্চ ব্যালেন্স: 150cs\n" +
        "🏦 চিন্তা নেই—বাকি টাকা নিরাপদে ব্যাংকেই আছে 🙂",

      walletLimitHit:
        "⚠️ Wallet ব্যালেন্স লিমিট পূর্ণ!\n" +
        "💼 Wallet-এ গেছে: %1\n" +
        "🏦 অতিরিক্ত টাকা ব্যাংকেই রাখা হয়েছে নিরাপদে 🙂"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};

    // ===== LOAD DATA (DECIMAL SAFE) =====
    let wallet = Number(user.money || 0);
    let bank = Number(user.data?.bank || 0);
    let loan = Number(user.data?.loan || 0);

    const save = async () => {
      await usersData.set(uid, {
        money: wallet,
        data: {
          bank,
          loan
        }
      });
    };

    const WALLET_LIMIT = 150;
    const LOAN_LIMIT = 1_000_000_000_000;

    // ===== SHOW STATUS =====
    if (!args[0]) {
      return message.reply(
        getLang(
          "status",
          utils.formatMoney(wallet),
          utils.formatMoney(bank),
          utils.formatMoney(loan)
        )
      );
    }

    const sub = args[0].toLowerCase();

    // ===== PARSE AMOUNT =====
    const amt = utils.parseAmount(args[1], "wallet", wallet, bank, loan);
    if (!amt || amt <= 0)
      return message.reply(getLang("invalidAmount"));

    // ===== DEPOSIT =====
    if (sub === "deposit" || sub === "dep") {
      if (wallet < amt)
        return message.reply(getLang("notEnoughWallet"));

      wallet -= amt;
      bank += amt;
      await save();
    }

    // ===== WITHDRAW (WITH WALLET LIMIT) =====
    else if (sub === "withdraw" || sub === "with") {
      if (bank < amt)
        return message.reply(getLang("notEnoughBank"));

      const space = WALLET_LIMIT - wallet;

      if (space <= 0) {
        return message.reply(getLang("walletFull"));
      }

      const withdrawAmt = amt > space ? space : amt;

      bank -= withdrawAmt;
      wallet += withdrawAmt;
      await save();

      if (withdrawAmt < amt) {
        return message.reply(
          getLang(
            "walletLimitHit",
            utils.formatMoney(withdrawAmt)
          )
        );
      }
    }

    // ===== LOAN =====
    else if (sub === "loan") {
      if (amt > LOAN_LIMIT)
        return message.reply(getLang("loanLimit"));

      loan += amt;
      wallet += amt;
      await save();
    }

    // ===== REPAY =====
    else if (sub === "repay" || sub === "pay") {
      if (loan <= 0)
        return message.reply(getLang("noLoan"));

      const pay = amt > loan ? loan : amt;
      if (wallet < pay)
        return message.reply(getLang("notEnoughWallet"));

      wallet -= pay;
      loan -= pay;
      await save();
    }

    else {
      return message.reply(getLang("invalidAmount"));
    }

    // ===== FINAL STATUS =====
    return message.reply(
      getLang(
        "status",
        utils.formatMoney(wallet),
        utils.formatMoney(bank),
        utils.formatMoney(loan)
      )
    );
  }
};
