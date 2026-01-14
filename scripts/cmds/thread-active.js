module.exports = {
	config: {
		name: "thread-active",
		aliases: ["thdin"],
		version: "1.0",
		author: "Rakib",
		role: 2,
		category: "owner",
		shortDescription: {
			en: "Show active threads count"
		}
	},

	onStart: async function ({ args, threadsData, message, role }) {
		if (role < 2)
			return message.reply("❌ You don't have permission");

		// only allow: thd active
		if (args[0] && args[0] !== "active")
			return;

		const allThreads = await threadsData.getAll();

		const activeThreads = allThreads.filter(thread =>
			thread.members?.some(m =>
				m.userID == global.GoatBot.botID && m.inGroup
			)
		);

		return message.reply(
			`🤖 Active Groups: ${activeThreads.length}\n` +
			`📦 Total Groups in DB: ${allThreads.length}`
		);
	}
};
