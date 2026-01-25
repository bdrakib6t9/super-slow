module.exports = {
  config: {
    name: "leave",
    version: "1.0",
    author: "Rakib",
    countDown: 5,
    role: 2,
    description: {
      vi: "Bot sẽ rời khỏi nhóm được chọn",
      en: "Bot will leave selected group"
    },
    category: "system",
    guide: {
      vi: "{pn}",
      en: "{pn}"
    }
  },

  langs: {
    vi: {
      list: "📋 Danh sách nhóm bot đang ở:\n\n%1\n\n↩️ Reply số để bot rời nhóm",
      left: "👋 Bot đã rời khỏi nhóm:\n%1",
      invalid: "❌ Số không hợp lệ",
      error: "❌ Không thể rời khỏi nhóm"
    },
    en: {
      list: "📋 List of groups bot is in:\n\n%1\n\n↩️ Reply with number to make bot leave",
      left: "👋 Bot has left the group:\n%1",
      invalid: "❌ Invalid number",
      error: "❌ Cannot leave the group"
    }
  },

  onStart: async function ({ api, event, message, getLang }) {
    try {
      const groups = await api.getThreadList(50, null, ["INBOX"]);
      const groupList = groups.filter(
        g => g.isGroup && g.threadName
      );

      if (!groupList.length)
        return message.reply("No group found.");

      const listText = groupList
        .map((g, i) => `${i + 1}. ${g.threadName}`)
        .join("\n");

      const sent = await message.reply(
        getLang("list", listText)
      );

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "leave",
        author: event.senderID,
        groupList
      });
    }
    catch (e) {
      console.error(e);
      message.reply(getLang("error"));
    }
  },

  onReply: async function ({ api, event, Reply, args, message, getLang }) {
    if (event.senderID !== Reply.author) return;

    const index = parseInt(args[0]);
    if (isNaN(index) || index <= 0)
      return message.reply(getLang("invalid"));

    const group = Reply.groupList[index - 1];
    if (!group)
      return message.reply(getLang("invalid"));

    try {
      // ⚠️ bot admin না হলেও কাজ করবে
      await api.removeUserFromGroup(
        api.getCurrentUserID(),
        group.threadID
      );

      message.reply(getLang("left", group.threadName));
    }
    catch (e) {
      console.error(e);
      message.reply(getLang("error"));
    }
    finally {
      global.GoatBot.onReply.delete(Reply.messageID);
    }
  }
};
