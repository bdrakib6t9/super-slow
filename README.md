# ☢ 𝐆𝐎𝐀𝐓 𖣘 𝐁𝐎𝐓 ⚠ 𝐑𝐀𝐊𝐈𝐁

<p align="center">
  <img src="https://i.imgur.com/zf6PcY7.jpeg" alt="Bot Preview" width="400" style="border-radius:20px; box-shadow:0 0 35px rgba(0,255,255,0.8); background: linear-gradient(135deg,#00ffff33,#ff00ff33); padding:15px; border:1px solid rgba(255,255,255,0.2);">
</p>
---

📌 About This Bot

Goat Bot is a Messenger Multi-Device automation bot with advanced features. It can download photos, videos, stickers, movies, adult content, and perform many automated tasks.


---
## 🧩 File Overview

| File/Folder | Purpose | Run/Use |
|-------------|---------|---------|
| `index.js` | Main bot file | `node index.js` |
| `package.json` | Dependencies & scripts info | `npm install` |
| `account.txt` | Bot login session/token | Auto-used |
| `config.json` | Bot configuration: prefix, owner, etc. | Auto-used |
| `configCommands.json` | Command-specific configs | Auto-used |
| `modules/` | All bot commands (JS files) | Auto-loaded |
| `bot/` | Core bot system | Auto-used |
| `dashboard/` | Dashboard files | Auto-used |
| `database/` | Data storage | Auto-used |
| `fb-chat-api/` | Messenger API | Auto-used |
| `func/` | Functions handler | Auto-used |
| `languages/` | Multi-language system | Auto-loaded |
| `logger/` | Logging system | Auto-used |
| `scripts/` | Extra scripts | Optional |
| `Goat.js` | Goat Bot main engine | Auto-used |
| `update.js` | Auto-update script | Manual/Auto |
| `updater.js` | Update checker | Auto-used |
| `utils.js` | Utility functions | Auto-used |
| `versions.json` | Version management | Auto-used |
| `README.md` | Documentation | ❌ Not for running |
| `CHANGELOG.md` | Version log | ❌ Not for running |


---

🚀 How To Run Locally

name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - uses: actions/checkout@v2

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm install

    - name: Start the bot
      env:
        PORT: 8080
      run: npm start


---

🛠 How To Start Goat Bot

npm install
node index.js

If you want to use PM2:

npm install -g pm2
pm2 start index.js --name "GoatBot"


---

📝 Notes

This version is fully adapted for Goat Bot.

This README is optimized for your current project structure.



---

If you want to add badges, extra sections, screenshots, or auto-install commands, just tell me! 🚀
