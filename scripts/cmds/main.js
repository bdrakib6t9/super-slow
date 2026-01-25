const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "main",
    version: "1.1",
    author: "Rakib",
    countDown: 5,
    category: "admin",
    role: 2
  },

  onStart: async function ({ api, args, message, event }) {
    const threadID = event.threadID;

    const dataDir = path.join(__dirname, "assist_json");
    const approvedIDsPath = path.join(dataDir, "approved_main.json");
    const pendingIDsPath = path.join(dataDir, "pending_main.json");

    // 🔹 Auto create folder
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // 🔹 Auto create files
    if (!fs.existsSync(approvedIDsPath)) {
      fs.writeFileSync(approvedIDsPath, JSON.stringify([]));
    }

    if (!fs.existsSync(pendingIDsPath)) {
      fs.writeFileSync(pendingIDsPath, JSON.stringify([]));
    }

    // 🔹 Read data safely
    let approvedIDs = JSON.parse(fs.readFileSync(approvedIDsPath));
    let pendingIDs = JSON.parse(fs.readFileSync(pendingIDsPath));

    // ================= COMMANDS =================

    if (args[0] === "approve" && args[1]) {
      const id = args[1];
      const adminMsg = args.slice(2).join(" ") || "No message";

      if (approvedIDs.includes(id)) {
        return message.reply("❌ This thread is already approved.");
      }

      approvedIDs.push(id);
      fs.writeFileSync(approvedIDsPath, JSON.stringify(approvedIDs, null, 2));

      // remove from pending
      if (pendingIDs.includes(id)) {
        pendingIDs.splice(pendingIDs.indexOf(id), 1);
        fs.writeFileSync(pendingIDsPath, JSON.stringify(pendingIDs, null, 2));
      }

      api.sendMessage(
        `✅ Request Approved\n\nMain commands are now unlocked.\n\nAdmin message: ${adminMsg}`,
        id
      );

      return message.reply("✅ Thread approved successfully.");
    }

    // --------------------------------------------

    if (args[0] === "remove" && args[1]) {
      const id = args[1];
      const reason = args.slice(2).join(" ") || "No reason";

      if (!approvedIDs.includes(id)) {
        return message.reply("❌ This thread is not approved.");
      }

      approvedIDs.splice(approvedIDs.indexOf(id), 1);
      fs.writeFileSync(approvedIDsPath, JSON.stringify(approvedIDs, null, 2));

      api.sendMessage(
        `⚠️ Permission Removed\n\nMain commands are now locked.\nReason: ${reason}`,
        id
      );

      return message.reply("✅ Thread removed successfully.");
    }

    // --------------------------------------------

    if (args[0] === "disapproved" && args[1]) {
      const id = args[1];
      const reason = args.slice(2).join(" ") || "No reason";

      if (!pendingIDs.includes(id)) {
        return message.reply("❌ This thread is not pending.");
      }

      pendingIDs.splice(pendingIDs.indexOf(id), 1);
      fs.writeFileSync(pendingIDsPath, JSON.stringify(pendingIDs, null, 2));

      api.sendMessage(
        `❌ Request Disapproved\nReason: ${reason}`,
        id
      );

      return message.reply("🚫 Pending request rejected.");
    }

    // --------------------------------------------

    if (args[0] === "check") {
      if (approvedIDs.includes(threadID)) {
        return message.reply("✅ Main commands are ENABLED here.");
      } else {
        return message.reply("❌ Main commands are DISABLED here.");
      }
    }

    // --------------------------------------------

    return message.reply(`❌ Invalid usage.\nType: help main`);
  }
};
