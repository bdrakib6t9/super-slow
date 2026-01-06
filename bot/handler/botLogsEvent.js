// botLogsEvent.js
// Event module: log when bot is added/removed from threads and notify admins with robust fallback.
// - Appends human-readable entries to bot_logs.txt (project root).
// - Saves structured entries to globalData under "botLogs" (if globalData available).
// - Tries DM to adminBot list; on DM failure tries to find a mutual thread containing that admin and sends there;
//   if no mutual thread, posts to the event thread as final fallback.

const fs = require("fs");
const PATH_LOG = process.cwd() + "/bot_logs.txt";
const JSON_LOG_KEY = "botLogs";
const MAX_JSON_LOGS = 1000;

module.exports = {
  config: {
    name: "botLogsEvent",
    version: "1.1",
    author: "Rakib",
    description: "Log bot add/remove events and notify admins with fallback delivery",
  },

  langs: {
    en: {
      addedSubject: "Bot was added to a group",
      removedSubject: "Bot was removed from a group",
      bodyTemplate:
        "====== Bot logs ======\n✅\nEvent: %1\n- Action by: %2\n- User ID: %3\n- Group: %4\n- Group ID: %5\n- Time: %6\n",
      noAdmins: "No adminBot configured to notify.",
    },
    bn: {
      addedSubject: "বটকে একটি গ্রুপে যোগ করা হয়েছে",
      removedSubject: "বটকে একটি গ্রুপ থেকে রিমুভ করা হয়েছে",
      bodyTemplate:
        "====== Bot logs ======\n✅\nEvent: %1\n- করা হয়েছে: %2\n- ইউজার আইডি: %3\n- গ্রুপ: %4\n- গ্রুপ আইডি: %5\n- সময়: %6\n",
      noAdmins: "নোটিফাই করার জন্য adminBot কনফিগার করা নেই।",
    },
  },

  /**
   * onStart runs on any event (handlerEvent calls it).
   * @param {Object} param0
   * @param {Object} param0.api
   * @param {Object} param0.event
   * @param {Object} param0.threadsData
   * @param {Object} param0.usersData
   * @param {Object} param0.globalData
   */
  onStart: async function ({ api, event, threadsData, usersData, globalData }) {
    try {
      // timestamp
      const now = new Date();
      const timeStr = now.toLocaleString("en-GB", { hour12: false });

      // detect bot id (multiple fallbacks)
      let botID = null;
      try {
        if (api && typeof api.getCurrentUserID === "function") botID = String(await api.getCurrentUserID());
      } catch (e) {}
      if (!botID) botID = String(global.GoatBot?.config?.BOT_ID || global.GoatBot?.config?.botID || global.GoatBot?.config?.PAGE_ID || "");
      if (!botID && global.client && global.client.userID) botID = String(global.client.userID || "");
      if (!botID) return; // cannot detect bot id -> abort

      // thread id
      const threadID = event.threadID || event.thread || event.messageThreadID || event.chatID;
      if (!threadID) return;

      // detect added/removed participants (multiple shapes)
      const added = event.addedParticipants || event.logMessageData?.addedParticipants || null;
      const removed = event.leftParticipants || event.removedParticipants || event.logMessageData?.leftParticipants || null;
      const singleAdded = event.logMessageData?.addedParticipantFbId || event.logMessageData?.addedParticipant || null;
      const singleRemoved = event.logMessageData?.leftParticipantFbId || event.logMessageData?.leftParticipant || null;

      const addedIds = [];
      const removedIds = [];

      if (Array.isArray(added)) {
        for (const a of added) {
          if (!a) continue;
          const id = a.userFbId || a.id || a.userID || a.user || a;
          if (id) addedIds.push(String(id));
        }
      }
      if (singleAdded) addedIds.push(String(singleAdded));

      if (Array.isArray(removed)) {
        for (const r of removed) {
          if (!r) continue;
          const id = r.userFbId || r.id || r.userID || r.user || r;
          if (id) removedIds.push(String(id));
        }
      }
      if (singleRemoved) removedIds.push(String(singleRemoved));

      // fallback: inspect logMessageType/body
      let eventType = null; // "added" | "removed"
      if (addedIds.includes(botID)) eventType = "added";
      else if (removedIds.includes(botID)) eventType = "removed";
      else {
        const lmType = String(event.logMessageType || event.type || "").toLowerCase();
        if (lmType.includes("subscribe") || lmType.includes("add") || lmType.includes("participant_add")) {
          if (String(event.body || JSON.stringify(event.logMessageData || "")).includes(botID)) eventType = "added";
        } else if (lmType.includes("remove") || lmType.includes("left") || lmType.includes("unsubscribe")) {
          if (String(event.body || JSON.stringify(event.logMessageData || "")).includes(botID)) eventType = "removed";
        }
      }
      if (!eventType) return;

      // actor who did the action
      const actorID = String(event.author || event.userID || event.senderID || event.logMessageData?.author || event.logMessageData?.addedBy || "") || "";
      let actorName = actorID ? `User ${actorID}` : "Unknown";
      try {
        if (actorID && usersData && typeof usersData.get === "function") {
          const u = await usersData.get(actorID);
          if (u && u.name) actorName = u.name;
        }
      } catch (e) { /* ignore */ }

      // thread info / name
      let threadInfo = null;
      try {
        if (threadsData && typeof threadsData.get === "function") threadInfo = await threadsData.get(threadID);
      } catch (e) {}
      if (!threadInfo && global.db && Array.isArray(global.db.allThreadData)) {
        threadInfo = global.db.allThreadData.find(t => (t.threadID || t.id) == threadID) || null;
      }
      const threadName = threadInfo?.threadName || threadInfo?.name || threadInfo?.data?.name || `Thread ${threadID}`;

      // prepare texts
      const lang = (threadInfo && threadInfo.data && threadInfo.data.lang) || global.GoatBot.config?.language || "en";
      const isEN = (lang || "en").startsWith("en");
      const subject = isEN ? this.langs.en[(eventType === "added") ? "addedSubject" : "removedSubject"] : this.langs.bn[(eventType === "added") ? "addedSubject" : "removedSubject"];
      const template = isEN ? this.langs.en.bodyTemplate : this.langs.bn.bodyTemplate;
      const eventLabel = eventType === "added" ? (isEN ? "bot has been added to a new group" : "বটকে একটি গ্রুপে যোগ করা হয়েছে") : (isEN ? "bot has been removed from a group" : "বটকে একটি গ্রুপ থেকে রিমুভ করা হয়েছে");
      const bodyText = template
        .replace("%1", eventLabel)
        .replace("%2", actorName)
        .replace("%3", actorID || "unknown")
        .replace("%4", threadName)
        .replace("%5", threadID)
        .replace("%6", timeStr);

      // append to local text log
      try {
        fs.appendFileSync(PATH_LOG, bodyText + "\n", { encoding: "utf8" });
      } catch (err) {
        console.error("[botLogsEvent] appendFile error:", err);
      }

      // append structured log to globalData
      try {
        if (globalData && typeof globalData.get === "function" && typeof globalData.set === "function") {
          let logs = await globalData.get(JSON_LOG_KEY, "data", []);
          if (!Array.isArray(logs)) logs = [];
          logs.push({
            id: Date.now(),
            event: eventType,
            actorID,
            actorName,
            threadID,
            threadName,
            time: now.getTime(),
            timeStr
          });
          if (logs.length > MAX_JSON_LOGS) logs = logs.slice(-MAX_JSON_LOGS);
          await globalData.set(JSON_LOG_KEY, logs, "data");
        }
      } catch (err) {
        console.error("[botLogsEvent] globalData save error:", err);
      }

      // === notify admins with robust fallback ===
      try {
        const adminList = Array.isArray(global.GoatBot?.config?.adminBot) ? global.GoatBot.config.adminBot.map(String) : [];
        if (!adminList || adminList.length === 0) {
          try { await api.sendMessage("[botLogsEvent] adminBot not configured; cannot DM admins.", threadID); } catch (e) { /* ignore */ }
        } else {
          // load all threads once (for fallback search)
          let allThreads = [];
          try {
            if (threadsData && typeof threadsData.getAll === "function") allThreads = await threadsData.getAll();
          } catch (e) { allThreads = []; }
          if ((!allThreads || allThreads.length === 0) && global.db && Array.isArray(global.db.allThreadData)) {
            allThreads = global.db.allThreadData;
          }

          for (const aid of adminList) {
            let sentOk = false;
            try {
              // primary: DM admin
              await api.sendMessage(`${subject}\n\n${bodyText}`, aid);
              sentOk = true;
            } catch (errSend) {
              console.error("[botLogsEvent] DM admin failed:", aid, errSend);

              // fallback 1: find mutual thread where admin is participant/admin
              try {
                let foundThread = null;
                if (Array.isArray(allThreads) && allThreads.length > 0) {
                  for (const t of allThreads) {
                    const tid = t.threadID || t.id || t._id;
                    if (!tid) continue;

                    // candidate participant lists in different shapes
                    const participants = t.participants || t.participantIDs || t.participant || t.data?.participants || t.data?.participantIDs || [];
                    const adminIDs = t.adminIDs || t.data?.adminIDs || [];

                    // normalize to string ids
                    const pStr = (participants || []).map(x => (typeof x === "object" ? (x.id || x.userID || x.userFbId || x) : x)).map(String);
                    const aStr = (adminIDs || []).map(String);

                    if (pStr.includes(String(aid)) || aStr.includes(String(aid))) {
                      foundThread = tid;
                      break;
                    }
                  }
                }

                if (foundThread) {
                  try {
                    await api.sendMessage(`${subject}\n\n${bodyText}\n\n(Delivery fallback to mutual thread ${foundThread})`, foundThread);
                    sentOk = true;
                  } catch (err2) {
                    console.error("[botLogsEvent] fallback send to mutual thread failed:", foundThread, err2);
                  }
                } else {
                  // fallback 2: post into the event thread so at least it's visible there
                  try {
                    await api.sendMessage(`${subject}\n\n${bodyText}\n\n(Note: couldn't DM admin ${aid} or find mutual thread.)`, threadID);
                    sentOk = true;
                  } catch (err3) {
                    console.error("[botLogsEvent] final fallback posting to event thread failed:", err3);
                  }
                }
              } catch (errFallback) {
                console.error("[botLogsEvent] notify fallback error:", errFallback);
              }
            }

            console.log(`[botLogsEvent] notify admin ${aid} result: ${sentOk ? "OK" : "FAILED"}`);
          } // end for each admin
        }
      } catch (errNotify) {
        console.error("[botLogsEvent] notify error:", errNotify);
      }

      // end main try
    } catch (err) {
      console.error("[botLogsEvent] unexpected error:", err);
    }
  } // end onStart
};
