// testdm.js (verbose error output)
module.exports = {
  config: {
    name: "testdm",
    aliases: ["tdm"],
    version: "1.1",
    author: "Debug",
    countDown: 5,
    role: 2,
    category: "system",
    description: "Send test DM to adminBot list and return full error details if any"
  },

  onStart: async function({ api, message }) {
    const admins = Array.isArray(global.GoatBot?.config?.adminBot) ? global.GoatBot.config.adminBot.map(String) : [];
    if (!admins.length) return message.reply("No adminBot configured.");

    const results = [];
    for (const aid of admins) {
      try {
        await api.sendMessage(`Test DM from bot at ${new Date().toLocaleString()}`, aid);
        results.push(`${aid}: OK`);
      } catch (err) {
        // try to convert error to readable string (capture non-enumerable props too)
        let errStr = "";
        try {
          // include enumerable + non-enumerable fields
          const allProps = Object.getOwnPropertyNames(err).reduce((o, k) => {
            try { o[k] = err[k]; } catch(e) { o[k] = String(e); }
            return o;
          }, {});
          errStr = JSON.stringify(allProps, null, 2);
        } catch (e) {
          errStr = String(err);
        }
        console.error("[testdm] send error to", aid, err);
        results.push(`${aid}: FAIL — ${errStr}`);
      }

      // small delay
      await new Promise(r => setTimeout(r, 600));
    }

    return message.reply("Test DM results:\n" + results.join("\n\n"));
  }
};
