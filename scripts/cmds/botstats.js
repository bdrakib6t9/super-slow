const os = require("os");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "botstats",
    author: "hoon (Enhanced & Fixed)",
    countDown: 5,
    role: 0,
    category: "tools",
    shortDescription: { en: "Advanced bot statistics" }
  },

  onStart: async function ({ event, api, usersData, threadsData }) {
    try {
      // Users & Threads
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();

      // Uptime
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      // Time & Date
      const time = moment().tz("Asia/Dhaka").format("hh:mm:ss A");
      const date = moment().tz("Asia/Dhaka").format("YYYY-MM-DD");
      const startTime = moment()
        .subtract(uptime, "seconds")
        .tz("Asia/Dhaka")
        .format("YYYY-MM-DD hh:mm:ss A");

      // RAM
      const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);

      // CPU
      const cpuModel = os.cpus()[0].model;
      const cpuCores = os.cpus().length;
      const load = os.loadavg()[0].toFixed(2);

      const msg =
`🤖 BOT STATISTICS

⏱ Uptime: ${h}h ${m}m ${s}s
🚀 Started At: ${startTime}

🕒 Time: ${time}
📅 Date: ${date}

👥 Total Users: ${allUsers.length}
💬 Total Threads: ${allThreads.length}

🧠 RAM Usage: ${usedMem} MB / ${totalMem} MB
⚙️ CPU: ${cpuModel}
🧩 CPU Cores: ${cpuCores}
📊 CPU Load: ${load}

✅ Status: Bot Running Smoothly`;

      api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      console.error("BOTSTATS ERROR:", err);
      api.sendMessage(
        "❌ Botstats লোড করতে সমস্যা হয়েছে!\nঅনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        event.threadID,
        event.messageID
      );
    }
  }
};
