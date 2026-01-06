module.exports = {
	config: {
		name: "thread-clean",
		aliases: ["thdclean"],
		version: "1.1",
		author: "Custom",
		role: 2,
		category: "owner",
		shortDescription: {
			en: "Clean thread database"
		}
	},

	onStart: async function ({ args, threadsData, message, role }) {
		if (role < 2)
			return message.reply("❌ You don't have permission");

		const allThreads = await threadsData.getAll();
		const input = args.join(" ");

		// 🧹 delete all inactive
		if (args[0] === "all") {
			const inactiveThreads = allThreads.filter(thread =>
				!thread.members?.some(m =>
					m.userID == global.GoatBot.botID && m.inGroup
				)
			);

			for (const thread of inactiveThreads) {
				await threadsData.delete(thread.threadID);
			}

			return message.reply(
				`🧹 Deleted ${inactiveThreads.length} inactive groups\n` +
				`📦 Remaining: ${allThreads.length - inactiveThreads.length}`
			);
		}

		// 🆔 delete by thread ID
		if (!isNaN(args[0])) {
			await threadsData.delete(args[0]);
			return message.reply(`✅ Deleted thread ID: ${args[0]}`);
		}

		// 🔍 delete by name
		const matched = allThreads.filter(thread =>
			(thread.threadName || "").toLowerCase().includes(input.toLowerCase())
		);

		if (!matched.length)
			return message.reply("❌ No thread found with that name");

		for (const thread of matched) {
			await threadsData.delete(thread.threadID);
		}

		return message.reply(
			`🗑️ Deleted ${matched.length} threads matching name: ${input}`
		);
	}
};
