const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {
		// Check if the bot is in the inbox and anti inbox is enabled
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;

		// optional debug: uncomment if you want to log incoming event types
		// console.log("[handler] incoming event.type:", event.type, "threadID:", event.threadID);

		onAnyEvent();

		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;

			// common system / log event types — ensure handlerEvent runs for these
			case "event":
			case "log:subscribe":
			case "log:unsubscribe":
			case "log:thread-name":
			case "log:thread-image":
			case "log:admin":
			case "log:thread-color":
			case "log:thread-icon":
			case "change_thread_image":
			case "change_thread_admin":
			case "change_thread_nickname":
			case "change_thread_theme":
				// run event handlers
				try {
					handlerEvent();
				} catch (e) {
					console.error("[handler] handlerEvent error:", e);
				}
				try {
					onEvent();
				} catch (e) {
					console.error("[handler] onEvent error:", e);
				}
				break;

			case "message_reaction":
				onReaction();
				break;
			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			default:
				// catch-all: if event.type is string and begins with "log:", treat as event
				if (typeof event.type === "string" && event.type.startsWith("log:")) {
					try {
						handlerEvent();
					} catch (e) {
						console.error("[handler] handlerEvent (fallback) error:", e);
					}
					try {
						onEvent();
					} catch (e) {
						console.error("[handler] onEvent (fallback) error:", e);
					}
				}
				break;
		}
	};
};
