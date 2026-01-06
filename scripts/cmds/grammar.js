const axios = require("axios");

// 🔒 one active grammar per user
const ACTIVE_GRAMMAR = new Map();

module.exports = {
  config: {
    name: "grammar",
    aliases: ["grm"],
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "education",
    guide: {
      en: "grammar → get grammar question\nReply with your answer"
    }
  },

  // ================= START =================
  onStart: async function ({ message, event, api }) {
    const uid = event.senderID;

    // 🚫 already answering
    if (ACTIVE_GRAMMAR.has(uid)) {
      return message.reply("⚠️ তুমি ইতিমধ্যে একটি Grammar প্রশ্নের উত্তর দিচ্ছো!");
    }

    try {
      const res = await axios.get(
        "https://rakib-api.vercel.app/api/grammar?category=Basic&apikey=rakib69"
      );

      const q = res.data;

      if (!q.question || !q.answer) {
        return message.reply("❌ Grammar data invalid!");
      }

      const text =
`📘 Grammar Practice

❓ Question:
${q.question}

✍️ এই মেসেজে রিপ্লাই করে উত্তর দাও`;

      const info = await message.reply(text);

      const timer = setTimeout(() => {
        ACTIVE_GRAMMAR.delete(uid);
        try {
          api.unsendMessage(info.messageID);
        } catch (_) {}
      }, 40000);

      ACTIVE_GRAMMAR.set(uid, true);

      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: uid,
        correctAnswer: String(q.answer).trim().toLowerCase(),
        grammarMessageID: info.messageID,
        timer
      });

    } catch (err) {
      ACTIVE_GRAMMAR.delete(uid);
      console.error(err);
      message.reply("❌ Grammar প্রশ্ন লোড করা যাচ্ছে না!");
    }
  },

  // ================= REPLY =================
  onReply: async function ({ message, event, Reply, api }) {
    const uid = event.senderID;

    try {
      if (uid !== Reply.author) return;

      const userAnswer = event.body.trim().toLowerCase();
      const correct = Reply.correctAnswer;

      clearTimeout(Reply.timer);
      ACTIVE_GRAMMAR.delete(uid);
      global.GoatBot.onReply.delete(Reply.grammarMessageID);

      try {
        api.unsendMessage(Reply.grammarMessageID);
      } catch (_) {}

      // ✅ correct
      if (userAnswer === correct) {
        return message.reply(
`✅ Correct Answer!

🎉 Well done!
Answer: ${Reply.correctAnswer}`
        );
      }

      // ❌ wrong
      return message.reply(
`❌ Wrong Answer!

✅ Correct Answer:
${Reply.correctAnswer}`
      );

    } catch (err) {
      ACTIVE_GRAMMAR.delete(uid);
      console.error("Grammar onReply error:", err);
    }
  }
};
