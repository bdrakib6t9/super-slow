let reactData = {};

module.exports = {
	config: {
		name: "rct",
		version: "1.0",
		author: "Rakib",
		countDown: 3,
		role: 0,
		shortDescription: {
			en: "Set auto reaction emoji"
		},
		description: {
			en: "Bot will auto react to messages with selected emoji"
		},
		category: "box chat"
	},

	onStart: async function ({ args, event, message }) {
		const threadID = event.threadID;

		// বন্ধ করার কমান্ড
		if (args[0] === "off") {
			delete reactData[threadID];
			return message.reply("❌ Auto reaction বন্ধ করা হয়েছে।");
		}

		const emoji = args.join(" ").trim();

		if (!emoji)
			return message.reply("⚠️ একটি emoji দিন\nউদাহরণ: rct 🌚");

		reactData[threadID] = emoji;
		return message.reply(`✅ Auto reaction সেট করা হয়েছে: ${emoji}`);
	},

	onChat: async function ({ event, api }) {
		const threadID = event.threadID;

		if (!reactData[threadID]) return;
		if (event.senderID === api.getCurrentUserID()) return;
		if (!event.messageID) return;

		try {
			await api.setMessageReaction(
				reactData[threadID],
				event.messageID,
				() => {},
				true
			);
		}
		catch (e) {}
	}
};
