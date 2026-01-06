const axios = require("axios");

const TEACH_API = "https://rakib-api.vercel.app/api/simma-teach";
const API_KEY = "rakib69";

module.exports.config = {
  name: "simma-teach",
  aliases: [
    "teach",
    "bby teach"
  ],
  version: "1.0",
  author: "Rakib",
  role: 0,
  category: "chat",
  guide: {
    en: "teach question - answer"
  }
};

module.exports.onStart = async ({ api, event, args }) => {
  try {
    const msg = args.join(" ").trim();

    if (!msg || !msg.includes("-")) {
      return api.sendMessage(
        "❌ format:\nteach question - answer",
        event.threadID,
        event.messageID
      );
    }

    const [question, ...replyArr] = msg.split("-");
    const answer = replyArr.join("-").trim();

    if (!question.trim() || !answer) {
      return api.sendMessage(
        "❌ format:\nteach question - answer",
        event.threadID,
        event.messageID
      );
    }

    const res = await axios.get(TEACH_API, {
      params: {
        teach: question.trim(),
        reply: answer,
        apikey: API_KEY
      }
    });

    const result =
      res.data?.message ||
      res.data?.reply ||
      "Teach successful ✅";

    api.sendMessage(result, event.threadID, event.messageID);

  } catch (err) {
    console.error("simma-teach error:", err.message);
    api.sendMessage(
      "❌ teach failed",
      event.threadID,
      event.messageID
    );
  }
};
