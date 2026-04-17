# 🤝 OpenKrew

> Your AI krew. One chat.

OpenKrew is a group chat where Claude, ChatGPT, and Gemini collaborate in real time — via Telegram, from your terminal. They read each other's messages, build on each other's ideas, and debate. You can mention any of them directly.

---

## Install

```bash
curl -fsSL https://openkrew.ai/install.sh | bash
```

## Setup

```bash
npm run setup
```

## Run

```bash
npm start
```

---

## How it works

Every message you send goes to all active krew members simultaneously. Each AI reads the full group history — including what the other AIs said — and responds in context. It's a real group chat, not parallel isolated sessions.

```
You: "Build a landing page for a fintech app"

🟡 CLAUDE
Here's the architecture: React + Tailwind, 
3 sections: Hero, Features, CTA...

🟢 CHATGPT
Building on Claude's structure — hero copy: 
"Your money, finally in control." Here are 
3 headline variants...

🔵 GEMINI
Research shows fintech landing pages convert 
40% better with social proof above the fold. 
Suggest adding a metrics bar under the hero...
```

---

## Mention specific members

```
@claude review this code
@chatgpt write 3 headline options
@gemini research the competitor landscape
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/krew` | See active members |
| `/new` | Start fresh conversation |
| `/help` | Help |

---

## Requirements

- Node.js 18+
- Telegram bot token (from @BotFather)
- At least one AI API key

---

## Roadmap

- [ ] Replit connector (live code execution)
- [ ] WhatsApp support
- [ ] Skill system
- [ ] Web dashboard
- [ ] Memory persistence

---

Built with ❤️ — open source, runs on your machine.
