// chatall.js
// Usage:
//  chatall           -> same as chatall all (total / fallback counts)
//  chatall all
//  chatall 1   or chatall 1d   -> last 1 day
//  chatall 7   or chatall 7d   -> last 7 days
//  chatall 30  or chatall 30d  -> last 30 days

module.exports = {
    config: {
        name: "chatall",
        aliases: ["callfail", "chattop", "chatstat"],
        version: "1.1",
        author: "Rakib+ChatGPT",
        countDown: 5,
        role: 0,
        description: "Show top message senders in this chat (top 20) with time filters",
        category: "utility",
        guide: "{pn} [all|1|7|30]  — e.g. {pn} 7 (top senders in last 7 days)"
    },

    langs: {
        en: {
            noData: "No message data found for this chat yet.",
            headerAll: "📊 Top %1 message senders in this chat (ALL time):",
            headerRange: "📊 Top %1 message senders in this chat (last %2 days):",
            line: "%1. %2 — %3 messages",
            footer: "Requested by %1",
            invalidRange: "Invalid range. Use one of: all / 1 / 7 / 30"
        },
        bn: {
            noData: "এই চ্যাটে এখনও মেসেজ ডেটা নেই। (প্রথমে messageLogger চালাও বা কেউ মেসেজ পাঠাক)।",
            headerAll: "📊 এই চ্যাটের শীর্ষ %1 জন মেসেজ সেন্ডার (সব সময়):",
            headerRange: "📊 এই চ্যাটের শীর্ষ %1 জন মেসেজ সেন্ডার (গত %2 দিন):",
            line: "%1. %2 — %3 টি মেসেজ",
            footer: "অনুরোধ করেছেন: %1",
            invalidRange: "ভুল রেঞ্জ। ব্যবহার করো: all / 1 / 7 / 30"
        }
    },

    onStart: async function({ message, event, args, usersData, getLang }) {
        try {
            const threadID = event.threadID || event.messageThreadID || event.chatID || "global";
            const arg = args[0] ? args[0].toLowerCase() : "all";

            // parse arg
            let mode = "all"; // or number of days
            if (arg === "all") mode = "all";
            else if (/^(\d+)(d)?$/.test(arg)) {
                const n = parseInt(arg.replace("d", ""));
                if ([1,7,30].includes(n)) mode = n;
                else return message.reply(getLang("invalidRange"));
            } else {
                return message.reply(getLang("invalidRange"));
            }

            // fetch all users
            let allUsers;
            if (typeof usersData.getAll === "function") {
                allUsers = await usersData.getAll();
            }
            else if (global.db && Array.isArray(global.db.allUserData)) {
                allUsers = global.db.allUserData;
            }
            else {
                return message.reply(getLang("noData"));
            }

            if (!allUsers || allUsers.length === 0)
                return message.reply(getLang("noData"));

            const now = Date.now();
            const results = [];

            for (const user of allUsers) {
                // handle various shapes
                const id = user.userID || user.id || (user.data && (user.data.userID || user.data.id)) || null;
                const data = user.data || user;

                if (!id || !data) continue;

                let count = 0;

                // Preferred: timestamped data per thread
                if (data.threadMessageTimestamps && typeof data.threadMessageTimestamps === "object") {
                    const arr = data.threadMessageTimestamps[threadID];
                    if (Array.isArray(arr) && arr.length > 0) {
                        if (mode === "all") {
                            count = arr.length;
                        } else {
                            const days = mode;
                            const cutoff = now - (days * 24 * 60 * 60 * 1000);
                            // count timestamps >= cutoff
                            for (let i = arr.length - 1; i >= 0; i--) {
                                if (arr[i] >= cutoff) count++;
                                else break; // assuming timestamps roughly appended in order
                            }
                        }
                    }
                }

                // Fallbacks if timestamps not present:
                if (count === 0) {
                    // legacy per-thread quick count
                    if (data.threadMessageCount && typeof data.threadMessageCount === "object") {
                        if (mode === "all") count = data.threadMessageCount[threadID] || 0;
                    }
                    // global totals as ultimate fallback (only makes sense for 'all')
                    if (count === 0 && mode === "all") {
                        if (typeof data.totalMessages === "number") count = data.totalMessages;
                        else if (typeof data.messageCount === "number") count = data.messageCount;
                    }
                }

                if (count > 0) {
                    results.push({
                        id,
                        name: data.name || data.fullName || `User ${id}`,
                        count
                    });
                }
            }

            if (results.length === 0) return message.reply(getLang("noData"));

            // sort desc by count
            results.sort((a,b) => b.count - a.count);

            const TOP_N = 20;
            const top = results.slice(0, TOP_N);

            let header;
            if (mode === "all") header = getLang("headerAll", top.length);
            else header = getLang("headerRange", top.length, mode);

            const lines = top.map((u, idx) => getLang("line", idx + 1, u.name, u.count));

            const requesterName = event.senderName || event.messageSenderName || ("User " + event.senderID);
            const footer = getLang("footer", requesterName);

            return message.reply(header + "\n\n" + lines.join("\n") + "\n\n" + footer);
        } catch (err) {
            console.error("chatall error:", err);
            return message.reply(getLang("noData"));
        }
    }
};
