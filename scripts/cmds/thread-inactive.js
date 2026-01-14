module.exports = {
	config: {
		name: "thread-inactive",
		aliases: ["thdun"],
		version: "1.0",
		author: "Rakib",
		role: 2,
		category: "owner",
		shortDescription: {
			en: "Show inactive threads count"
		}
	},

	onStart: async function ({ args, threadsData, message, role }) {
		if (role < 2)
			return message.reply("❌ You don't have permission");

		// only allow: thd inactive
		if (args[0] && args[0] !== "inactive")
			return;

		const allThreads = await threadsData.getAll();

		const inactiveThreads = allThreads.filter(thread =>
			!thread.members?.some(m =>
				m.userID == global.GoatBot.botID && m.inGroup
			)
		);

		return message.reply(
			`💀 Inactive Groups: ${inactiveThreads.length}\n` +
			`📦 Total Groups in DB: ${allThreads.length}`
		);
	}
};
