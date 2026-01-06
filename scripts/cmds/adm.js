module.exports = {
  config: {
    name: "adm",
    version: "1.1",
    author: "ChatGPT",
    countDown: 5,
    role: 1,
    description: {
      vi: "Reply/Mention করে কাউকে group admin on/off করা",
      en: "Make someone group admin on/off by reply or mention"
    },
    category: "box chat",
    guide: {
      vi:
        "{pn} on: reply/mention করা user কে admin বানাবে\n" +
        "{pn} off: reply/mention করা user এর admin সরাবে",
      en:
        "{pn} on: make replied/mentioned user admin\n" +
        "{pn} off: remove admin from replied/mentioned user"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    if (!args[0])
      return message.reply("⚠️ | ব্যবহার করুন: adm on / adm off (reply বা mention সহ)");

    let targetIDs = [];

    if (Object.keys(event.mentions).length > 0)
      targetIDs = Object.keys(event.mentions);
    else if (event.messageReply)
      targetIDs = [event.messageReply.senderID];

    if (targetIDs.length === 0)
      return message.reply("⚠️ | কাউকে reply বা mention করুন");

    const threadInfo = await api.getThreadInfo(event.threadID);
    const currentAdmins = threadInfo.adminIDs.map(i => i.id);

    if (args[0] === "on") {
      for (const uid of targetIDs) {
        if (!currentAdmins.includes(uid))
          await api.changeAdminStatus(event.threadID, uid, true);
      }
      return message.reply("✅ | নির্বাচিত user কে group ADMIN বানানো হয়েছে");
    }

    if (args[0] === "off") {
      for (const uid of targetIDs) {
        if (currentAdmins.includes(uid))
          await api.changeAdminStatus(event.threadID, uid, false);
      }
      return message.reply("❌ | নির্বাচিত user এর ADMIN সরানো হয়েছে");
    }

    return message.reply("⚠️ | ভুল কমান্ড। adm on / adm off ব্যবহার করুন");
  }
};
