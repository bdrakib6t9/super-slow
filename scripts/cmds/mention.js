module.exports = {
  config: {
    name: "mention",
    aliases: ["men"],
    version: "1.0",
    author: "Rakib Hasan",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Mention a replied person or everyone"
    },
    longDescription: {
      en: "Reply to someone and type mention to tag them, or type mention everyone to tag all members."
    },
    category: "utility",
    guide: {
      en: "{pn} (while replying) — mention replied user\n{pn} everyone — tag everyone"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {

    // ---------- EVERYONE MENTION ----------
    if (args[0] && args[0].toLowerCase() === "everyone") {

      const threadInfo = await threadsData.get(event.threadID);
      const members = threadInfo.members;

      const mentions = [];
      let msg = "⚠️ @Everyone Mention:\n";

      for (const mem of members) {
        mentions.push({
          id: mem.userID,
          tag: mem.name
        });
        msg += `• ${mem.name}\n`;
      }

      message.reply({
        body: msg,
        mentions
      });

      return;
    }

    // ---------- REPLIED USER MENTION ----------
    if (event.type === "message_reply") {
      const replied = event.messageReply;

      const name = replied.senderName || "User";

      message.reply({
        body: `🎯 Mentioned: @${name}`,
        mentions: [{
          id: replied.senderID,
          tag: name
        }]
      });

      return;
    }

    // ---------- NO REPLY + NOT EVERYONE ----------
    message.reply("❌ কারো মেসেজে রিপ্লাই দাও বা 'mention everyone' লিখো।");
  }
};
