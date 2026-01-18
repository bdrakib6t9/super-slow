module.exports = {
	config: {
		name: "leaveall",
		author: "Rakib",
		version: "1.5.1",
		countDown: 10,
		role: 0,
		category: "Admin",
		shortDescription: {
			en: "leave all group (owner only)"
		}
	},

	onStart: async function ({ api, event }) {
		const OWNER_UID = "61581351693349";

		// owner check
		if (event.senderID !== OWNER_UID) {
			return api.sendMessage(
				"❌ এই কমান্ডটা শুধু বট ওনার ব্যবহার করতে পারবে।",
				event.threadID
			);
		}

		api.getThreadList(100, null, ["INBOX"], (err, list) => {
			if (err) return api.sendMessage("Error occurred!", event.threadID);

			list.forEach(item => {
				if (item.isGroup === true && item.threadID !== event.threadID) {
					api.removeUserFromGroup(
						api.getCurrentUserID(),
						item.threadID
					);
				}
			});

			api.sendMessage(
				"✅ সব গ্রুপ থেকে বট সফলভাবে লিভ করেছে।",
				event.threadID
			);
		});
	}
};
