module.exports = {
	config: {
		name: "notice",
		aliases: ["broadcast", "bc", "announce"],
		version: "1.2",
		author: "Rakib",
		countDown: 10,
		role: 2, // 2 = adminBot only (GoatBot handler অনুযায়ী)
		description: {
			en: "Send a notice message to all threads the bot is in",
			bn: "বট যে সব গ্রুপ/থ্রেডে আছে সেখানে একসাথে নোটিশ পাঠানো"
		},
		category: "system", // 🔥 এটা না থাকলে "category of command undefined" আসে
		guide: {
			en: "{pn} <message>\nExample: {pn} Server maintenance tonight at 10 PM.",
			bn: "{pn} <মেসেজ>\nউদাহরণ: {pn} আজ রাত ১০টায় সার্ভারে মেইনটেনেন্স হবে।"
		}
	},

	langs: {
		en: {
			noContent: "Please type the notice content after the command.",
			sending: "Starting broadcast to all threads... (this may take some time)",
			noThreadData: "Cannot load thread list (no thread data found).",
			summary: "📢 Broadcast summary:\n• Total threads found: %1\n• Attempted: %2\n• Success: %3\n• Failed: %4",
		},
		bn: {
			noContent: "কমান্ডের পরে কী নোটিশ পাঠাবে সেটা লিখো।",
			sending: "সব থ্রেডে নোটিশ পাঠানো শুরু করা হচ্ছে... একটু সময় লাগতে পারে।",
			noThreadData: "থ্রেড লিস্ট লোড করা যায়নি (কোনো thread data পাওয়া যায়নি)।",
			summary: "📢 ব্রডকাস্ট সারাংশ:\n• মোট থ্রেড: %1\n• চেষ্টা করা হয়েছে: %2\n• সফল: %3\n• ব্যর্থ: %4"
		}
	},

	onStart: async function ({ api, message, event, args, threadsData, getLang }) {
		const senderID = event.senderID || event.userID || event.author;

		// নোটিশ টেক্সট
		let content = args.join(" ").trim();

		// যদি reply করা মেসেজকে নোটিশ বানাতে চাও
		if (!content && event.messageReply && event.messageReply.body) {
			content = event.messageReply.body;
		}

		if (!content) {
			return message.reply(getLang("noContent"));
		}

		// আগে ব্যবহারকারীকে জানিয়ে দেই
		await message.reply(getLang("sending"));

		// সব থ্রেডের লিস্ট নিয়ে আসা
		let allThreads = [];

		// চেষ্টা ১: threadsData.getAll()
		if (threadsData && typeof threadsData.getAll === "function") {
			try {
				allThreads = await threadsData.getAll();
			} catch (e) {
				console.error("[notice] threadsData.getAll error:", e);
			}
		}

		// চেষ্টা ২: global.db.allThreadData fallback
		if ((!allThreads || allThreads.length === 0) && global.db && Array.isArray(global.db.allThreadData)) {
			allThreads = global.db.allThreadData;
		}

		if (!allThreads || allThreads.length === 0) {
			return message.reply(getLang("noThreadData"));
		}

		// threadID ফিল্টার করা (ব্যানড বাদ)
		const targets = [];
		for (const t of allThreads) {
			const id = t.threadID || t.id;
			if (!id) continue;

			// থ্রেড ব্যানড হলে স্কিপ
			const bannedInfo = t.banned || t.data?.banned;
			if (bannedInfo && bannedInfo.status === true) continue;

			targets.push(id);
		}

		if (targets.length === 0) {
			return message.reply(getLang("noThreadData"));
		}

		// পাঠানোর জন্য message body
		const noticeBody =
			"📢 NOTICE\n\n" +
			content +
			`\n\n— Sent by admin (UID: ${senderID})`;

		let success = 0;
		let failed = 0;
		let attempted = 0;

		// rate-limit এ যাতে না পড়ে, একটু করে delay
		const DELAY = 800; // চাইলে বেশি করো: 1000–1500

		for (const tid of targets) {
			attempted++;
			try {
				await api.sendMessage(noticeBody, tid);
				success++;
			} catch (err) {
				console.error(`[notice] send fail to ${tid}:`, err);
				failed++;
			}
			// ছোট delay
			await new Promise(res => setTimeout(res, DELAY));
		}

		// summary রিপ্লাই
		return message.reply(
			getLang(
				"summary",
				targets.length,
				attempted,
				success,
				failed
			)
		);
	}
};
