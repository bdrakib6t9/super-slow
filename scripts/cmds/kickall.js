const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "kickall",
    version: "1.2",
    author: "Rakib",
    countDown: 10,
    role: 0,
    description: {
      vi: "Kick toàn bộ thành viên trong nhóm",
      en: "Kick all members in the group"
    },
    category: "box chat",
    guide: {
      vi: "{pn}",
      en: "{pn}"
    }
  },

  langs: {
    vi: {
      onlyOwner: "❌ Chỉ bot owner mới được dùng lệnh này",
      needAdmin: "❌ Bot cần quyền quản trị viên",
      done: "✅ Đã kick toàn bộ thành viên"
    },
    en: {
      onlyOwner: "❌ Only bot owner can use this command",
      needAdmin: "❌ Bot must be group admin",
      done: "✅ All members have been kicked"
    }
  },

  onStart: async function ({ api, event, message, threadsData, getLang }) {

    // 🔒 Owner Check (string-safe)
    if (!ownerUID.includes(String(event.senderID)))
      return message.reply(getLang("onlyOwner"));

    const botID = api.getCurrentUserID();

    // 🔍 Bot Admin Check
    const adminIDs = await threadsData.get(event.threadID, "adminIDs");
    if (!adminIDs.includes(botID))
      return message.reply(getLang("needAdmin"));

    // 📌 Get thread info
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.participantIDs;

    // Separate admins (excluding bot & owners)
    const admins = threadInfo.adminIDs
      .map(e => e.id)
      .filter(uid => uid !== botID && !ownerUID.includes(String(uid)));

    // Separate normal members
    const normalMembers = members.filter(
      uid =>
        uid !== botID &&
        !ownerUID.includes(String(uid)) &&
        !admins.includes(uid)
    );

    // 🚫 Kick admins first
    for (const uid of admins) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {}
    }

    // 🚫 Kick normal members
    for (const uid of normalMembers) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {}
    }

    return message.reply(getLang("done"));
  }
};
