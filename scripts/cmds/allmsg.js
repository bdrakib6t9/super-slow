module.exports = {
	config: {
		name: "allmsg",
		aliases: ["allchat", "chat", "totalmsg"],
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		description: {
			vi: "xem top 10 người chat nhiều nhất",
			en: "view top 10 users by total messages",
			bn: "সর্বাধিক চ্যাট করা টপ ১০ ইউজার দেখুন"
		},
		category: "group",
		guide: {
			vi: "   {pn}: xem bảng xếp hạng chat",
			en: "   {pn}: view chat leaderboard",
			bn: "   {pn}: চ্যাট লিডারবোর্ড দেখুন"
		}
	},

	langs: {
		vi: {
			noData: "Chưa có dữ liệu chat.",
			title: "💬 TOP 10 CHAT NHIỀU NHẤT (ALL TIME) 💬"
		},
		en: {
			noData: "No chat data found.",
			title: "💬 TOP 10 MOST ACTIVE CHATTERS 💬"
		},
		bn: {
			noData: "এখনও কোনো চ্যাট ডাটা নেই।",
			title: "💬 টপ ১০ সর্বাধিক চ্যাটকারী (সবসময়) 💬"
		}
	},

	onStart: async function ({ message, usersData, getLang }) {
		let allUsers;

		// GoatBot V2 compatible
		if (typeof usersData.getAll === "function") {
			allUsers = await usersData.getAll();
		}
		// fallback
		else if (global.db && Array.isArray(global.db.allUserData)) {
			allUsers = global.db.allUserData;
		}
		else {
			return message.reply(getLang("noData"));
		}

		if (!allUsers || allUsers.length === 0)
			return message.reply(getLang("noData"));

		const leaderboard = [];

		for (const user of allUsers) {
			const msgCount =
				typeof user.messageCount === "number"
					? user.messageCount
					: (typeof user.data?.messageCount === "number"
						? user.data.messageCount
						: 0);

			if (msgCount <= 0) continue;

			leaderboard.push({
				id: user.userID || user.id,
				name: user.name || user.data?.name || "Unknown User",
				count: msgCount
			});
		}

		if (leaderboard.length === 0)
			return message.reply(getLang("noData"));

		// Sort descending
		leaderboard.sort((a, b) => b.count - a.count);

		const top10 = leaderboard.slice(0, 10);

		let msg = getLang("title") + "\n\n";
		const medals = ["🥇", "🥈", "🥉"];

		top10.forEach((user, index) => {
			const medal = medals[index] || `#${index + 1}`;
			msg += `${medal} ${user.name} → ${user.count} messages\n`;
		});

		return message.reply(msg);
	}
};
