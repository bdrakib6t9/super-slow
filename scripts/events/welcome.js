const { getTime } = global.utils;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.1",
		author: "NTKhang + Premium Edit",
		category: "events"
	},

	langs: {
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			multiple1: "you",
			multiple2: "you guys",

			defaultWelcomeMessage:
`╔══════════════════════╗  
   🎉  𝐖𝐄𝐋𝐂𝐎𝐌𝐄  🎉  
╚══════════════════════╝  

👋 𝐇𝐞𝐥𝐥𝐨 {𝐮𝐬𝐞𝐫𝐍𝐚𝐦𝐞}  
✨ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 **{𝐛𝐨𝐱𝐍𝐚𝐦𝐞}**  

🔢 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 **{𝐦𝐞𝐦𝐛𝐞𝐫𝐂𝐨𝐮𝐧𝐭}𝐭𝐡** 𝐦𝐞𝐦𝐛𝐞𝐫  
🕒 𝐇𝐚𝐯𝐞 𝐚 𝐰𝐨𝐧𝐝𝐞𝐫𝐟𝐮𝐥 {𝐬𝐞𝐬𝐬𝐢𝐨𝐧}  

💖 𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐬𝐭𝐚𝐲 & 𝐛𝐞 𝐟𝐫𝐢𝐞𝐧𝐝𝐥𝐲!`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType !== "log:subscribe") return;

		const { threadID } = event;
		const hours = getTime("HH");
		const dataAddedParticipants = event.logMessageData.addedParticipants;

		if (!global.temp.welcomeEvent[threadID]) {
			global.temp.welcomeEvent[threadID] = {
				joinTimeout: null,
				dataAddedParticipants: []
			};
		}

		global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
		clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

		global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
			const threadData = await threadsData.get(threadID);
			if (threadData.settings.sendWelcomeMessage === false) return;

			const threadInfo = await api.getThreadInfo(threadID);
			const memberCount = threadInfo.participantIDs.length;
			const threadName = threadData.threadName;

			const userNames = [];
			const mentions = [];
			const isMultiple =
				global.temp.welcomeEvent[threadID].dataAddedParticipants.length > 1;

			for (const user of global.temp.welcomeEvent[threadID].dataAddedParticipants) {
				userNames.push(user.fullName);
				mentions.push({ tag: user.fullName, id: user.userFbId });
			}

			let welcomeMessage =
				threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");

			welcomeMessage = welcomeMessage
				.replace(/\{userName\}/g, userNames.join(", "))
				.replace(/\{boxName\}/g, threadName)
				.replace(/\{memberCount\}/g, memberCount)
				.replace(
					/\{multiple\}/g,
					isMultiple ? getLang("multiple2") : getLang("multiple1")
				)
				.replace(
					/\{session\}/g,
					hours <= 10
						? getLang("session1")
						: hours <= 12
						? getLang("session2")
						: hours <= 18
						? getLang("session3")
						: getLang("session4")
				);

			// welcome image
			const imgPath = path.join(__dirname, "welcome.jpg");
			const img = await axios.get(
				"https://i.postimg.cc/Sx10LZdn/welcome.jpg",
				{ responseType: "arraybuffer" }
			);
			fs.writeFileSync(imgPath, img.data);

			message.send({
				body: welcomeMessage,
				mentions,
				attachment: fs.createReadStream(imgPath)
			});

			delete global.temp.welcomeEvent[threadID];
		}, 1500);
	}
};
