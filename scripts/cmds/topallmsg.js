module.exports = {
	config: {
		name: "topallmsg",
		aliases: ["globalmsg", "msgworld"],
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		category: "system"
	},

	onStart: async function ({ message, usersData }) {
		if (typeof usersData.getAll !== "function")
			return message.reply("❌ usersData.getAll সাপোর্ট করে না");

		const allUsers = await usersData.getAll();

		const list = allUsers
			.map(u => ({
				id: u.userID || u.id,
				total: u.totalMessage || u.data?.totalMessage || 0,
				name: u.name || u.data?.name || "Unknown"
			}))
			.filter(u => u.total > 0);

		if (list.length === 0)
			return message.reply("❌ কোনো ডাটা নেই");

		list.sort((a, b) => b.total - a.total);

		const top10 = list.slice(0, 10);
		const medals = ["🥇", "🥈", "🥉"];

		let msg = "🌍🏆 GLOBAL MESSAGE LEADERBOARD 🏆🌍\n\n";

		top10.forEach((u, i) => {
			const rank = medals[i] || `#${i + 1}`;
			msg += `${rank} ${u.name} → ${u.total} messages\n`;
		});

		message.reply(msg);
	}
};
