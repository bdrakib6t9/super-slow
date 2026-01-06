// coinflip.js (updated)
// Supports: solo vs bot and PvP challenge.
// For PvP: sender: `coinflip @user <amount>`
// Target can accept by replying: `coinflip head` or `coinflip tail` (no "accept" needed).
module.exports = {
  config: {
    name: "coinflip",
    aliases: ["coin", "cf"],
    version: "1.1",
    author: "Rakib+ChatGPT",
    countDown: 5,
    role: 0,
    description: {
      en: "Play coinflip solo vs bot or challenge another user (PvP). Target accepts by replying 'coinflip head' or 'coinflip tail'.",
      bn: "বট বা অন্য ব্যবহারকারীর সঙ্গে coinflip খেলো। টার্গেট সরাসরি 'coinflip head' বা 'coinflip tail' লিখে গ্রহণ করতে পারবে।"
    },
    guide: {
      en:
        "{pn} <amount> [head|tail] - play solo vs bot\n" +
        "{pn} @user <amount> - challenge user to PvP (they accept by: {pn} head or {pn} tail)\n" +
        "{pn} head - accept an incoming challenge by choosing HEAD\n" +
        "{pn} tail - accept an incoming challenge by choosing TAIL",
      bn:
        "{pn} <amount> [head|tail] - বটের বিরুদ্ধে খেলো\n" +
        "{pn} @user <amount> - কাউকে চ্যালেঞ্জ পাঠাও (সে গ্রহণ করবে: {pn} head বা {pn} tail)\n" +
        "{pn} head - চ্যালেঞ্জ গ্রহণ করে HEAD নির্বাচন\n" +
        "{pn} tail - চ্যালেঞ্জ গ্রহণ করে TAIL নির্বাচন"
    },
    category: "economy"
  },

  langs: {
    en: {
      noAmount: "Please enter an amount to bet.",
      invalidAmount: "Invalid amount. Enter a positive integer.",
      minBet: "Minimum bet is %1$.",
      notEnough: "You don't have enough balance. Your balance: %1$",
      soloChoiceInfo: "You chose %1. Coin flipping...",
      soloResultWin: "🎉 You WON! Coin: %1. You gained %2$. New balance: %3$",
      soloResultLose: "💀 You LOST! Coin: %1. You lost %2$. New balance: %3$",
      challengeSent: "⚔️ Challenge sent to %1 for %2$.\nThey can accept by replying: `coinflip head` or `coinflip tail` (within %3 seconds).",
      noMention: "Please tag the user you want to challenge.",
      cannotChallengeSelf: "You cannot challenge yourself.",
      alreadyChallengeExists: "There is already a pending challenge for %1. Try later.",
      noPendingToAccept: "You have no pending challenges to accept.",
      acceptTimeout: "This challenge has expired.",
      acceptNotEnough: "One of the players doesn't have enough balance now. Cancelling.",
      pvpResult: "🎲 PvP Result!\nCoin: %1\nWinner: %2\nLoser lost: %3$\nWinner new balance: %4$\nLoser new balance: %5$",
      declined: "Challenge declined.",
      acceptPrompt: "%1 has challenged you for %2$. Reply with `coinflip head` or `coinflip tail` to accept."
    },
    bn: {
      noAmount: "কত টাকা বেট করবে সেটা লিখো।",
      invalidAmount: "সঠিক পরিমাণ লিখো (পজিটিভ পূর্ণ সংখ্যা)।",
      minBet: "ন্যূনতম বেট %1$।",
      notEnough: "তোমার ব্যালেন্স পর্যাপ্ত নেই। তোমার ব্যালেন্স: %1$",
      soloChoiceInfo: "তুমি নির্বাচন করেছো %1। ডাইন চলছে...",
      soloResultWin: "🎉 তুমি জিতেছো! ফল: %1। তুমি পেয়েছো %2$। নতুন ব্যালেন্স: %3$",
      soloResultLose: "💀 তুমি হেরেছো! ফল: %1। তুমি হারিয়েছো %2$। নতুন ব্যালেন্স: %3$",
      challengeSent: "⚔️ %1 কে %2$ এর চ্যালেঞ্জ পাঠানো হয়েছে。\nতিনি গ্রহণ করতে পারেন: `coinflip head` বা `coinflip tail` (%3 সেকেন্ডের মধ্যে)।",
      noMention: "আপনি কাউকে ট্যাগ করেননি।",
      cannotChallengeSelf: "নিজেকে চ্যালেঞ্জ করা যাবে না।",
      alreadyChallengeExists: "%1 এর জন্য ইতোমধ্যে পেন্ডিং চ্যালেঞ্জ আছে। পরে চেষ্টা করো।",
      noPendingToAccept: "তোমার জন্য কোনো পেন্ডিং চ্যালেঞ্জ নেই।",
      acceptTimeout: "চ্যালেঞ্জটি সময়সীমা পেরিয়ে গিয়েছে।",
      acceptNotEnough: "খেলার সময় কারো ব্যালেন্স পর্যাপ্ত ছিল না। চ্যালেঞ্জ বাতিল করা হলো।",
      pvpResult: "🎲 PvP ফলাফল!\nমুদ্রা: %1\nজয়ী: %2\nপরাজিত হারিয়েছে: %3$\nজয়ীর নতুন ব্যালেন্স: %4$\nপরাজিতের নতুন ব্যালেন্স: %5$",
      declined: "চ্যালেঞ্জ প্রত্যাখ্যাত হয়েছে।",
      acceptPrompt: "%1 তোমাকে %2$ এর জন্য চ্যালেঞ্জ করেছে। গ্রহণ করতে `coinflip head` অথবা `coinflip tail` লিখো।"
    }
  },

  // In-memory challenge store.
  // Structure: { [targetID]: { from: senderID, amount, fromName, toName, timestamp } }
  _challenges: {},

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const userID = event.senderID;
    const TIMEOUT = 30 * 1000; // 30 seconds in ms

    const normalizeChoice = txt => {
      if (!txt) return null;
      const t = txt.toLowerCase();
      if (t === "head" || t === "heads") return 0;
      if (t === "tail" || t === "tails") return 1;
      return null;
    };

    const findAmount = arr => {
      for (const a of arr) {
        if (/^\d+$/.test(a)) return parseInt(a);
      }
      return null;
    };

    // ------------- 1) If args is head/tail and there is a pending challenge for this user -> treat as accept -------------
    const maybeChoice = args[0] ? normalizeChoice(args[0]) : null;
    if (maybeChoice !== null && this._challenges[userID]) {
      const pending = this._challenges[userID];
      const now = Date.now();

      if (now - pending.timestamp > TIMEOUT) {
        delete this._challenges[userID];
        return message.reply(getLang("acceptTimeout"));
      }

      const amount = pending.amount;
      const fromID = pending.from;

      // load user datas
      let fromData = await usersData.get(fromID) || {};
      let toData = await usersData.get(userID) || {};
      fromData.money = typeof fromData.money === "number" ? fromData.money : 0;
      toData.money = typeof toData.money === "number" ? toData.money : 0;

      // check balances again
      if (fromData.money < amount || toData.money < amount) {
        delete this._challenges[userID];
        return message.reply(getLang("acceptNotEnough"));
      }

      // Determine sides:
      // Target (userID) chose maybeChoice (0=head,1=tail). Sender gets opposite.
      const targetChoice = maybeChoice;
      const senderChoice = 1 - targetChoice;

      // perform flip: 0=head,1=tail
      const flip = Math.floor(Math.random() * 2);

      // decide winner
      let winnerID, loserID;
      if (flip === targetChoice) {
        winnerID = userID;
        loserID = fromID;
      } else {
        winnerID = fromID;
        loserID = userID;
      }

      // transfer amount from loser to winner
      if (winnerID === fromID) {
        fromData.money += amount;
        toData.money -= amount;
      } else {
        fromData.money -= amount;
        toData.money += amount;
      }

      // save
      await usersData.set(fromID, fromData);
      await usersData.set(userID, toData);

      // clean challenge
      delete this._challenges[userID];

      const winnerName = winnerID === fromID ? (pending.fromName || ("User" + fromID)) : (pending.toName || ("User" + userID));
      const loserName = loserID === fromID ? (pending.fromName || ("User" + fromID)) : (pending.toName || ("User" + userID));

      return message.reply(
        getLang(
          "pvpResult",
          flip === 0 ? "HEAD" : "TAIL",
          winnerName,
          amount,
          winnerID === fromID ? fromData.money : toData.money,
          loserID === fromID ? fromData.money : toData.money
        )
      );
    }

    // ------------- 2) If args is head/tail but no pending challenge -> treat as normal solo (choice provided) -------------
    // This will be handled in solo logic below.

    // ------------- 3) If mention present -> create a challenge -------------
    if (Object.keys(event.mentions).length > 0) {
      const uids = Object.keys(event.mentions);
      const targetID = uids[0];

      if (targetID === userID) return message.reply(getLang("cannotChallengeSelf"));

      const amount = findAmount(args);
      if (!amount) return message.reply(getLang("noAmount"));
      if (amount <= 0) return message.reply(getLang("invalidAmount"));

      const MIN_BET = 1;
      if (amount < MIN_BET) return message.reply(getLang("minBet", MIN_BET));

      // check sender balance
      let senderData = await usersData.get(userID) || {};
      senderData.money = typeof senderData.money === "number" ? senderData.money : 0;
      if (senderData.money < amount) return message.reply(getLang("notEnough", senderData.money));

      // ensure no existing challenge for target
      if (this._challenges[targetID]) return message.reply(getLang("alreadyChallengeExists", pendingNameOrId(targetID)));

      // create challenge
      this._challenges[targetID] = {
        from: userID,
        fromName: event.mentions[userID] ? event.mentions[userID].replace("@", "") : ("User" + userID),
        toName: event.mentions[targetID] ? event.mentions[targetID].replace("@", "") : ("User" + targetID),
        amount,
        timestamp: Date.now()
      };

      const seconds = TIMEOUT / 1000;
      const targetName = event.mentions[targetID] ? event.mentions[targetID].replace("@", "") : ("User" + targetID);
      return message.reply(getLang("challengeSent", targetName, amount, seconds));
    }

    // ------------- 4) Solo play vs bot -------------
    // pattern: coinflip <amount> [head|tail]
    const amountSolo = findAmount(args);
    if (!amountSolo) return message.reply(getLang("noAmount"));
    if (amountSolo <= 0) return message.reply(getLang("invalidAmount"));

    const MIN_BET_SOLO = 1;
    if (amountSolo < MIN_BET_SOLO) return message.reply(getLang("minBet", MIN_BET_SOLO));

    // optional choice
    let choice = null;
    if (args[1]) {
      choice = normalizeChoice(args[1]);
    } else if (args[0] && isNaN(parseInt(args[0]))) {
      // maybe user typed: coinflip head (and no amount) - then invalid for solo because amount missing
      // but above we already ensured amountSolo exists, so ignore.
    }

    // load user data
    let userData = await usersData.get(userID) || {};
    userData.money = typeof userData.money === "number" ? userData.money : 0;

    if (userData.money < amountSolo) return message.reply(getLang("notEnough", userData.money));

    // perform flip: 0 = HEAD, 1 = TAIL
    const flipSolo = Math.floor(Math.random() * 2);

    // If user didn't choose, pick random for user
    let userGuess;
    if (choice === null) {
      userGuess = Math.floor(Math.random() * 2);
    } else {
      userGuess = choice;
    }

    // ---- Build single combined message (choice info + result) ----
    const choiceText = userGuess === 0 ? "HEAD" : "TAIL";

    // Determine win/lose and update balance accordingly
    let resultText;
    if (userGuess === flipSolo) {
      // win: user gains amount (profit = amount)
      userData.money += amountSolo;
      await usersData.set(userID, userData);
      resultText = getLang("soloResultWin", flipSolo === 0 ? "HEAD" : "TAIL", amountSolo, userData.money);
    } else {
      // lose: user loses amount
      userData.money -= amountSolo;
      await usersData.set(userID, userData);
      resultText = getLang("soloResultLose", flipSolo === 0 ? "HEAD" : "TAIL", amountSolo, userData.money);
    }

    // Combine choice info and result into a single message
    const combined = `${getLang("soloChoiceInfo", choiceText)}\n${resultText}`;
    return message.reply(combined);

    // helper to format pending name if needed
    function pendingNameOrId(id){
      try {
        return id;
      } catch (e) {
        return id;
      }
    }
  }
};
