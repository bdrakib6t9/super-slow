module.exports = {
  config: {
    name: "pending",
    aliases: ["pnd"],
    version: "1.1",
    author: "Rakib",
    countDown: 5,
    role: 1,
    description: {
      vi: "Quản lý thành viên chờ duyệt",
      en: "Manage pending members"
    },
    category: "box chat",
    guide: {
      vi: "{pn}\n{pn} info\n{pn} approve <number>",
      en: "{pn}\n{pn} info\n{pn} approve <number>"
    }
  },

  langs: {
    vi: {
      needAdmin: "❌ Bot cần quyền quản trị viên",
      noPending: "✅ Không có thành viên đang chờ",
      list: "📋 Danh sách chờ duyệt:\n%1",
      approvedOne: "✅ Đã duyệt: %1",
      approvedAll: "🎉 Đã duyệt %1 thành viên",
      invalid: "❌ Số không hợp lệ",
      error: "❌ Có lỗi xảy ra"
    },
    en: {
      needAdmin: "❌ Bot needs admin permission",
      noPending: "✅ No pending members",
      list: "📋 Pending list:\n%1",
      approvedOne: "✅ Approved: %1",
      approvedAll: "🎉 Approved %1 members",
      invalid: "❌ Invalid number",
      error: "❌ An error occurred"
    }
  },

  onStart: async function ({ api, event, args, message, threadsData, getLang }) {
    try {
      const adminIDs = await threadsData.get(event.threadID, "adminIDs");
      if (!adminIDs.includes(api.getCurrentUserID()))
        return message.reply(getLang("needAdmin"));

      const pending = await api.getThreadJoinRequests(event.threadID);
      if (!pending || pending.length === 0)
        return message.reply(getLang("noPending"));

      // pending info
      if (args[0] === "info") {
        const list = pending
          .map((u, i) => `${i + 1}. ${u.fullName}`)
          .join("\n");
        return message.reply(getLang("list", list));
      }

      // approve specific user
      if (args[0] === "approve") {
        const index = parseInt(args[1]) - 1;
        if (isNaN(index) || !pending[index])
          return message.reply(getLang("invalid"));

        const user = pending[index];
        await api.approveJoinRequest(event.threadID, user.userID);
        return message.reply(getLang("approvedOne", user.fullName));
      }

      // approve all
      for (const user of pending) {
        await api.approveJoinRequest(event.threadID, user.userID);
      }
      return message.reply(getLang("approvedAll", pending.length));
    }
    catch (e) {
      return message.reply(getLang("error"));
    }
  }
};
