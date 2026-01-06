const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "transfer",
    aliases: ["pay", "send"],
    version: "2.2",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: "Transfer money to tagged or replied user (k/m/b supported)",
    category: "economy",
    guide: "{pn} @tag <amount|all> OR reply <amount|all>"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const senderID = event.senderID;
    let receiverID;

    /* ===== RECEIVER DETECT ===== */
    if (Object.keys(event.mentions).length > 0) {
      receiverID = Object.keys(event.mentions)[0];
    }
    else if (event.messageReply) {
      receiverID = event.messageReply.senderID;
    }
    else {
      return message.reply("❌ যাকে টাকা পাঠাবে তাকে @tag করো অথবা তার মেসেজে reply দাও।");
    }

    if (receiverID === senderID)
      return message.reply("❌ নিজেকে টাকা পাঠানো যায় না!");

    /* ===== LOAD USERS ===== */
    const senderData = await usersData.get(senderID) || {};
    const receiverData = await usersData.get(receiverID) || {};

    // 🔥 SAFE BIGINT (CRITICAL FIX)
    let senderMoney = utils.safeBigInt(senderData.money);
    let receiverMoney = utils.safeBigInt(receiverData.money);

    /* ===== PARSE AMOUNT ===== */
    const amountArg = args[0];
    const amount = utils.parseAmount(
      amountArg,
      "wallet",
      senderMoney,
      0,
      0
    );

    if (!amount || typeof amount !== "bigint" || amount <= 0n)
      return message.reply("❌ সঠিক Amount লিখো (k/m/b/all কাজ করে)।");

    if (senderMoney < amount)
      return message.reply(
        `❌ তোমার কাছে এত টাকা নেই!\n` +
        `বর্তমান ব্যালেন্স: ${utils.formatMoney(senderMoney)}`
      );

    /* ===== TRANSFER ===== */
    senderMoney -= amount;
    receiverMoney += amount;

    await usersData.set(senderID, {
      ...senderData,
      money: senderMoney.toString()
    });

    await usersData.set(receiverID, {
      ...receiverData,
      money: receiverMoney.toString()
    });

    /* ===== RECEIVER NAME ===== */
    let receiverName = "ব্যবহারকারী";
    if (event.mentions[receiverID]) {
      receiverName = event.mentions[receiverID].replace("@", "");
    }

    return message.reply(
      `✅ সফলভাবে ${utils.formatMoney(amount)} পাঠানো হয়েছে ${receiverName} কে!\n\n` +
      `💼 তোমার বর্তমান ব্যালেন্স: ${utils.formatMoney(senderMoney)}`
    );
  }
};
