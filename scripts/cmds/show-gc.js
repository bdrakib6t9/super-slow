module.exports = {
	config: {
		name: "show-gc",
		aliases: ["sgc", "showgc"],
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Show group chat name"
		},
		description: {
			en: "Bot will reply with the current group chat name"
		},
		category: "box chat"
	},

	onStart: async function ({ event, api, message }) {
		try {
			// যদি গ্রুপ না হয়
			if (!event.isGroup)
				return message.reply("❌ এটা কোনো গ্রুপ চ্যাট না।");

			const threadInfo = await api.getThreadInfo(event.threadID);
			const groupName = threadInfo.threadName;

			if (!groupName)
				return message.reply("ℹ️ এই গ্রুপের কোনো নাম সেট করা নেই।");

			return message.reply(`📌 Group Name:\n${groupName}`);
		}
		catch (e) {
			return message.reply("⚠️ গ্রুপের নাম আনতে সমস্যা হয়েছে!");
		}
	}
};
