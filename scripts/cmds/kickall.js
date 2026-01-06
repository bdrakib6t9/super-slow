module.exports = {
  config: {
    name: "kickall",
    version: "1.0",
    author: "Rakib",
    countDown: 10,
    role: 0, // permission manually checked
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
    const OWNER_UID = "61581351693349";

    // owner check
    if (event.senderID !== OWNER_UID)
      return message.reply(getLang("onlyOwner"));

    // bot admin check
    const adminIDs = await threadsData.get(event.threadID, "adminIDs");
    const botID = api.getCurrentUserID();
    if (!adminIDs.includes(botID))
      return message.reply(getLang("needAdmin"));

    // get all members
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.participantIDs;

    // separate admins & members
    const admins = threadInfo.adminIDs
      .map(e => e.id)
      .filter(uid => uid !== botID && uid !== OWNER_UID);

    const normalMembers = members.filter(
      uid => uid !== botID && uid !== OWNER_UID && !admins.includes(uid)
    );

    // kick admins first
    for (const uid of admins) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {}
    }

    // kick normal members
    for (const uid of normalMembers) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {}
    }

    return message.reply(getLang("done"));
  }
};
