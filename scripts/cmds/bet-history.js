const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "bet-history",
    aliases: ["bethistory", "bethis"],
    role: 0,
    category: "economy",
    description: {
      en: "View bet history (self / mention / reply)",
      bn: "নিজের বা অন্যের বেট হিস্টোরি দেখুন"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    let targetID = event.senderID;
    let targetName = "Your";

    /* ======================
       MENTION SUPPORT
    ====================== */
    if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      targetName = event.mentions[targetID].replace("@", "");
    }

    /* ======================
       REPLY SUPPORT
    ====================== */
    else if (event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
      const repliedUser = await usersData.get(targetID);
      targetName = repliedUser?.name || "User";
    }

    const user = await usersData.get(targetID) || {};
    const history = user.data?.betHistory || [];

    if (!history.length)
      return message.reply("📭 No bet history found.");

    let msg = `📜 **${targetName} Bet History (Last 5)**\n\n`;

    history
      .slice(-5)
      .reverse()
      .forEach((h, i) => {
        msg +=
          `${i + 1}. ${h.result}\n` +
          `   💵 Bet: ${utils.formatMoney(h.amount)}\n` +
          `   🏦 Balance: ${utils.formatMoney(h.balance)}\n\n`;
      });

    return message.reply(msg.trim());
  }
};
