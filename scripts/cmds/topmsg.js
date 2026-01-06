module.exports = {
	config: {
		name: "topmsg",
		aliases: ["topmessage", "msgtop"],
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		category: "group",
		description: {
			bn: "কে কতগুলো মেসেজ করেছে (Top 10)",
			en: "Top 10 message senders"
		}
	},

	onStart: async function ({ message, threadsData, usersData, event }) {
		const threadID = event.threadID;
		const threadData = await threadsData.get(threadID);

		if (!threadData || !threadData.members)
			return message.reply("❌ কোনো ডাটা পাওয়া যায়নি");

		// শুধু যারা গ্রুপে আছে
		const members = threadData.members
			.filter(m => m.inGroup && typeof m.count === "number");

		if (members.length === 0)
			return message.reply("❌ এখনো কোনো মেসেজ কাউন্ট হয়নি");

		// sort descending
		members.sort((a, b) => b.count - a.count);

		const top10 = members.slice(0, 10);
		const medals = ["🥇", "🥈", "🥉"];

		let msg = "🏆 TOP 10 MESSAGE LEADERBOARD 🏆\n\n";

		for (let i = 0; i < top10.length; i++) {
			const user = top10[i];
			const name = await usersData.getName(user.userID);
			const rank = medals[i] || `#${i + 1}`;
			msg += `${rank} ${name} → ${user.count} messages\n`;
		}

		message.reply(msg);
	}
};
