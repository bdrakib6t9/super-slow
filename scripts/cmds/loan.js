const utils = require("../../utils.js");

const HOUR = 60 * 60 * 1000;
const MAX_TIME = 24 * HOUR;
const FREE_TIME = 5 * HOUR;

function calcInterestPercent(startTime) {
  const elapsed = Date.now() - startTime;
  if (elapsed <= FREE_TIME) return 0;

  const chargeHours = Math.min(
    Math.floor((elapsed - FREE_TIME) / HOUR),
    19 // max 19%
  );

  return chargeHours;
}

async function autoCollectIfDue(lenderID, usersData) {
  const lender = await usersData.get(lenderID);
  if (!lender?.data?.loans) return;

  const loans = lender.data.loans;
  const remaining = [];

  let lenderWallet = BigInt(lender.money || 0);

  for (const loan of loans) {
    const elapsed = Date.now() - loan.startTime;
    if (elapsed < MAX_TIME) {
      remaining.push(loan);
      continue;
    }

    const borrower = await usersData.get(loan.borrowerID);
    if (!borrower) continue;

    let borrowerWallet = BigInt(borrower.money || 0);
    const interest = calcInterestPercent(loan.startTime);
    const returnAmount =
      BigInt(loan.amount) +
      (BigInt(loan.amount) * BigInt(interest) / 100n);

    if (borrowerWallet < returnAmount) continue;

    borrowerWallet -= returnAmount;
    lenderWallet += returnAmount;

    await usersData.set(loan.borrowerID, {
      ...borrower,
      money: borrowerWallet.toString()
    });
  }

  await usersData.set(lenderID, {
    ...lender,
    money: lenderWallet.toString(),
    data: {
      ...lender.data,
      loans: remaining
    }
  });
}

module.exports = {
  config: {
    name: "loan",
    aliases: ["sud", "sudi"],
    version: "2.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const lenderID = event.senderID;

    // 🔁 Auto collect if 24h passed
    await autoCollectIfDue(lenderID, usersData);

    const lender = await usersData.get(lenderID) || {};
    const lenderData = lender.data || {};
    let lenderWallet = BigInt(lender.money || 0);

    /* ======================
       LIST
    ====================== */
    if (args[0] === "list") {
      const loans = lenderData.loans || [];
      if (!loans.length)
        return message.reply("📭 কোনো active loan নেই।");

      let msg = "📒 Active Loans:\n\n";
      loans.forEach((l, i) => {
        const interest = calcInterestPercent(l.startTime);
        const ret =
          BigInt(l.amount) +
          (BigInt(l.amount) * BigInt(interest) / 100n);

        msg +=
          `${i + 1}. 👤 ${l.borrowerName}\n` +
          `   💵 Given: ${utils.formatMoney(l.amount)}\n` +
          `   📈 Interest: ${interest}%\n` +
          `   💰 Return Now: ${utils.formatMoney(ret)}\n\n`;
      });

      return message.reply(msg.trim());
    }

    /* ======================
       MANUAL COLLECT
    ====================== */
    if (args[0] === "collect") {
      const borrowerID = Object.keys(event.mentions)[0];
      if (!borrowerID)
        return message.reply("❌ কাউকে mention করো।");

      const loans = lenderData.loans || [];
      const index = loans.findIndex(l => l.borrowerID === borrowerID);
      if (index === -1)
        return message.reply("❌ এই ইউজারের loan নেই।");

      const loan = loans[index];
      const borrower = await usersData.get(borrowerID) || {};
      let borrowerWallet = BigInt(borrower.money || 0);

      const interest = calcInterestPercent(loan.startTime);
      const returnAmount =
        BigInt(loan.amount) +
        (BigInt(loan.amount) * BigInt(interest) / 100n);

      if (borrowerWallet < returnAmount)
        return message.reply("❌ Borrower-এর কাছে পর্যাপ্ত টাকা নেই।");

      borrowerWallet -= returnAmount;
      lenderWallet += returnAmount;
      loans.splice(index, 1);

      await usersData.set(borrowerID, {
        ...borrower,
        money: borrowerWallet.toString()
      });

      await usersData.set(lenderID, {
        ...lender,
        money: lenderWallet.toString(),
        data: {
          ...lenderData,
          loans
        }
      });

      return message.reply(
        `✅ Loan collected!\n\n` +
        `👤 Borrower: ${loan.borrowerName}\n` +
        `📈 Interest: ${interest}%\n` +
        `💰 Received: ${utils.formatMoney(returnAmount)}`
      );
    }

    /* ======================
       CREATE LOAN
    ====================== */
    const borrowerID = Object.keys(event.mentions)[0];
if (!borrowerID || args.length < 2)
  return message.reply("❌ loan @user <amount>");

const borrower = await usersData.get(borrowerID) || {};
const borrowerName = borrower.name || "Unknown";

// amount সবসময় last argument
const amountArg = args[args.length - 1];

const amount = utils.parseAmount(
  amountArg,
  "wallet",
  lenderWallet,
  0,
  0
);

if (!amount || typeof amount !== "bigint" || amount <= 0n)
  return message.reply("❌ Invalid amount.");

    if (lenderWallet < amount)
      return message.reply("❌ তোমার কাছে এত টাকা নেই।");

    lenderWallet -= amount;
    let borrowerWallet = BigInt(borrower.money || 0);
    borrowerWallet += amount;

    const loans = lenderData.loans || [];
    loans.push({
      borrowerID,
      borrowerName,
      amount: amount.toString(),
      startTime: Date.now()
    });

    await usersData.set(borrowerID, {
      ...borrower,
      money: borrowerWallet.toString()
    });

    await usersData.set(lenderID, {
      ...lender,
      money: lenderWallet.toString(),
      data: {
        ...lenderData,
        loans
      }
    });

    return message.reply(
      `💰 Loan given!\n\n` +
      `👤 Borrower: ${borrowerName}\n` +
      `💵 Amount: ${utils.formatMoney(amount)}\n` +
      `⏳ Interest starts after 5 hours\n` +
      `📈 +1% per hour\n` +
      `⏰ Auto return after 24 hours`
    );
  }
};
