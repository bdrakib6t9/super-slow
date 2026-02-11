const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "debug",
    aliases: ["dg"],
    version: "1.1",
    author: "Rakib",
    role: 2,
    shortDescription: "Debug why bot not working in this chat",
    longDescription: "Diagnose bot permission, request & thread issues",
    category: "Utility"
  },

  onStart: async function ({ event, api }) {

    // 🔒 Owner Check (external file)
    if (!ownerUID.includes(event.senderID)) {
      return api.sendMessage(
        "❌ এই কমান্ডটি শুধু Bot Owner ব্যবহার করতে পারবেন।",
        event.threadID,
        event.messageID
      );
    }

    const threadID = event.threadID;
    let report = "🧪 BOT DEBUG REPORT\n";
    report += "━━━━━━━━━━━━━━━━━━\n";

    /* 1️⃣ Thread Info */
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
      report += "📌 Thread Info: OK\n";
      report += `• Name: ${threadInfo.threadName || "Inbox"}\n`;
      report += `• Type: ${threadInfo.isGroup ? "Group Chat" : "Inbox"}\n`;
      report += `• Members: ${threadInfo.participantIDs.length}\n`;
    } catch (e) {
      report += "❌ Thread Info: FAILED (Message Request / Blocked)\n";
      report += "➡️ Most likely message request not accepted\n\n";
      return api.sendMessage(report, threadID);
    }

    /* 2️⃣ Bot Admin Check */
    if (threadInfo.isGroup) {
      const botID = api.getCurrentUserID();
      const isAdmin = threadInfo.adminIDs
        .map(e => e.id)
        .includes(botID);

      report += `\n👑 Bot Admin: ${isAdmin ? "YES" : "NO ❌"}\n`;
      if (!isAdmin) {
        report += "➡️ Bot admin না হলে অনেক command কাজ করবে না\n";
      }
    }

    /* 3️⃣ Bot Mute Check */
    if (threadInfo.muteUntil) {
      report += "\n🔇 Bot Muted: YES ❌\n";
    } else {
      report += "\n🔊 Bot Muted: NO\n";
    }

    /* 4️⃣ Send Message Test */
    let sendTest = true;
    try {
      await api.sendMessage(
        "🧪 Debug test message (auto-delete)",
        threadID
      );
    } catch (e) {
      sendTest = false;
    }

    report += `\n📨 Send Message Test: ${sendTest ? "OK" : "FAILED ❌"}\n`;

    /* 5️⃣ Final Diagnosis */
    report += "\n━━━━━━━━━━━━━━━━━━\n";
    report += "🧠 DIAGNOSIS:\n";

    const botID = api.getCurrentUserID();
    const isAdminNow = threadInfo.isGroup
      ? threadInfo.adminIDs.map(e => e.id).includes(botID)
      : true;

    if (!sendTest) {
      report += "❌ Bot cannot send message\n";
      report += "➡️ Possible reasons:\n";
      report += "• Message request not accepted\n";
      report += "• Bot restricted / blocked by Facebook\n";
    } 
    else if (threadInfo.isGroup && !isAdminNow) {
      report += "⚠️ Bot is not admin\n";
      report += "➡️ Ask group admin to make bot admin\n";
    } 
    else {
      report += "✅ Bot should work normally here\n";
      report += "➡️ If still not working, FB silent block possible\n";
    }

    api.sendMessage(report, threadID, event.messageID);
  }
};
