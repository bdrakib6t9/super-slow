const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
	config: {
		name: "leaveall",
		author: "Rakib",
		version: "1.6.1",
		countDown: 10,
		role: 0,
		category: "Admin",
		shortDescription: {
			en: "leave all group (owner only)"
		}
	},

	onStart: async function ({ api, event }) {

		// 🔒 Owner Check (string-safe)
		if (!ownerUID.includes(String(event.senderID))) {
			return api.sendMessage(
				"❌ এই কমান্ডটা শুধু বট ওনার ব্যবহার করতে পারবে।",
				event.threadID,
				event.messageID
			);
		}

		api.getThreadList(100, null, ["INBOX"], async (err, list) => {
			if (err)
				return api.sendMessage(
					"❌ Error occurred!",
					event.threadID,
					event.messageID
				);

			const botID = api.getCurrentUserID();
			let count = 0;

			for (const item of list) {
				if (item.isGroup === true && item.threadID !== event.threadID) {
					try {
						await api.removeUserFromGroup(botID, item.threadID);
						count++;
						await new Promise(r => setTimeout(r, 500));
					} catch (e) {}
				}
			}

			return api.sendMessage(
				`✅ বট সফলভাবে ${count} টি গ্রুপ থেকে লিভ করেছে।`,
				event.threadID,
				event.messageID
			);
		});
	}
};
