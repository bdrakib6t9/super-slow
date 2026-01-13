module.exports = {
  config: {
    name: "tag",
    version: "3.0",
    author: "Rakib Hasan",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Tag members by fuzzy name similarity"
    },
    longDescription: {
      en: "Mention members using typo tolerance and similarity percentage"
    },
    category: "utility",
    guide: {
      en: "{pn} <name>"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {

    if (!args[0]) {
      return message.reply("❌ ব্যবহার: tag <name>");
    }

    const rawKeyword = args.join(" ");
    const keyword = normalizeText(rawKeyword);
    const threadID = event.threadID;

    const threadInfo = await threadsData.get(threadID);
    const members = threadInfo.members || [];

    const mentions = [];
    let msg = `🔔 Tag result for "${rawKeyword}" (≥70% match):\n`;
    let count = 0;

    for (const member of members) {
      const name = member.name || "";
      const normalizedName = normalizeText(name);

      const similarity = getSimilarity(keyword, normalizedName);

      if (similarity >= 0.7) {
        mentions.push({
          id: member.userID,
          tag: name
        });
        msg += `• ${name} (${Math.round(similarity * 100)}%)\n`;
        count++;
      }
    }

    if (count === 0) {
      return message.reply(`❌ "${rawKeyword}" এর সাথে 70% বা তার বেশি মিল পাওয়া যায়নি।`);
    }

    message.reply({
      body: msg,
      mentions
    });
  }
};

/* ================= UTILITIES ================= */

/**
 * Normalize text:
 * - lowercase
 * - remove spaces, symbols
 * - remove font styles & accents
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Similarity = 1 - (Levenshtein distance / max length)
 */
function getSimilarity(a, b) {
  if (!a || !b) return 0;

  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);

  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Levenshtein Distance Algorithm
 */
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
      }
