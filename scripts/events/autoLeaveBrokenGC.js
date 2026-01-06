const OWNER_ID = "61581351693349";
const SCAN_INTERVAL = 30 * 60 * 1000;

global.brokenThreads ??= new Set();
global.__BROKEN_GC_SCANNER_STARTED__ ??= false;

module.exports = {
  config: {
    name: "autoLeaveBrokenGC",
    category: "events"
  },

  // 🔹 dummy onStart (required by loader)
  onStart: async function () {},

  onLoad: async function ({ api, threadsData }) {
    if (global.__BROKEN_GC_SCANNER_STARTED__) return;
    global.__BROKEN_GC_SCANNER_STARTED__ = true;

    console.log("🛡️ Broken GC background scanner running");

    setInterval(async () => {
      const threads = await threadsData.getAll();

      for (const thread of threads) {
        const threadID = thread.threadID;
        if (!threadID) continue;
        if (global.brokenThreads.has(threadID)) continue;

        try {
          await api.sendTypingIndicator(threadID);
        }
        catch {
          global.brokenThreads.add(threadID);

          let info = {};
          try {
            info = await api.getThreadInfo(threadID);
          } catch {}

          try {
            await api.sendMessage(
              `🚨 AUTO LEAVE BROKEN GC\n\n` +
              `ThreadID: ${threadID}\n` +
              `Name: ${info.threadName || "Unknown"}\n\n` +
              `❌ Bot cannot send messages\n` +
              `➡️ Leaving automatically`,
              OWNER_ID
            );
          } catch {}

          try {
            await api.removeUserFromGroup(
              api.getCurrentUserID(),
              threadID
            );
          } catch {}
        }

        await new Promise(r => setTimeout(r, 1500));
      }
    }, SCAN_INTERVAL);
  }
};
