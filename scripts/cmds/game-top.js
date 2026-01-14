module.exports = {
	config: {
		name: "game-top",
		aliases: ["gmtop", "gametop"],
		version: "1.0",
		author: "Rakib",
		role: 0,
		category: "game",
		countDown: 5
	},

	onStart: async function ({ message, usersData }) {
		let allUsers;

		if (typeof usersData.getAll === "function") {
			allUsers = await usersData.getAll();
		} else {
			return message.reply("❌ Leaderboard data not available.");
		}

		const list = [];

		for (const u of allUsers) {
			const id = u.userID || u.id;
			const data = u.data || u;

			if (!data) continue;

			const exp = data.exp || 0;
			if (exp <= 0) continue;

			list.push({
				id,
				name: data.name || `User ${id}`,
				exp,
				level: Math.floor(exp / 1000),
				money: data.money || 0
			});
		}

		if (list.length === 0)
			return message.reply("❌ No game data found.");

		list.sort((a, b) => b.exp - a.exp);

		const top = list.slice(0, 10);

		let text = "🏆 GAME TOP 10 PLAYERS\n\n";

		top.forEach((u, i) => {
			const medal = ["🥇", "🥈", "🥉"][i] || "🔹";
			text +=
				`${medal} ${i + 1}. ${u.name}\n` +
				`   🏅 Lv ${u.level} | ✨ ${u.exp} EXP | 💰 ${u.money}$\n\n`;
		});

		return message.reply(text);
	}
};
