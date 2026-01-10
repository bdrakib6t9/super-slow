const utils = require("../../utils.js");

// ===== SAFE NUMBER PARSER =====
function toNumber(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string")
    return parseFloat(val.replace(/[^\d.]/g, "")) || 0;
  return 0;
}

module.exports = {
  config: {
    name: "bank",
    aliases: ["vault"],
    version: "7.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  langs: {
    en: {
      status:
        "💳 Your balance:\n" +
        "💼 Bal: %1\n" +
        "🏦 Bank: %2\n" +
        "💸 Loan: %3",

      invalidAmount: "❌ Invalid amount",
      notEnoughWallet: "❌ Not enough wallet balance",
      notEnoughBank: "❌ Not enough bank balance",
      noLoan: "❌ You don't have any active loan",
      loanLimit: "❌ Loan limit exceeded",

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
    const userData = await usersData.get(uid) || {};

    // ===== LOAD BALANCE (SAME STYLE AS balance.js) =====
    let wallet = toNumber(userData.money);
    let bank = toNumber(userData.data?.bank);
    let loan = toNumber(userData.data?.loan);

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

    // ===== PARSE AMOUNT (FORCE NUMBER) =====
    const amt = Number(
      utils.parseAmount(args[1], "wallet", wallet, bank, loan)
    );

    if (!Number.isFinite(amt) || amt <= 0)
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

      const withdrawAmt = Math.min(space, amt);

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

      const pay = Math.min(amt, loan);

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
