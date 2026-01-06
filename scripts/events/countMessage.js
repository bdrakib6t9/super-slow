module.exports = {
	config: {
		name: "countMessage",
		version: "1.1",
		author: "Rakib",
		category: "events"
	},

	onStart: async function ({ event, threadsData, api }) {
		// ignore system message
		if (event.senderID === "0")
			return;

		// bot নিজের message ignore
		if (event.senderID === api.getCurrentUserID())
			return;

		// message / sticker / attachment count
		const hasMessage =
			event.body ||
			(event.attachments && event.attachments.length > 0);

		if (!hasMessage)
			return;

		const threadID = event.threadID;
		const senderID = event.senderID;

		const threadData = await threadsData.get(threadID);
		if (!threadData)
			return;

		let members = threadData.members || [];

		let member = members.find(m => String(m.userID) === String(senderID));

		if (!member) {
			member = {
				userID: senderID,
				count: 1,
				inGroup: true
			};
			members.push(member);
		}
		else {
			member.count = (member.count || 0) + 1;
		}

		// শুধু members field update
		await threadsData.set(threadID, members, "members");
	}
};
