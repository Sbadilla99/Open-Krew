<div align="center">

# ⚡ OpenKrew

**Multi-agent AI orchestration. Any task. Any channel.**

*Send one message. Your krew of AI engines collaborates, executes, and delivers.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Powered by Anthropic](https://img.shields.io/badge/Powered%20by-Anthropic-orange.svg)](https://anthropic.com)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-teal.svg)](https://netlify.com)

</div>

---

## What is OpenKrew?

OpenKrew is an **open-source multi-agent orchestration engine** that connects language models, deployment engines, and external tools — all accessible from any chat interface.

You describe what you need in plain language. OpenKrew's intelligent router classifies the task, assembles the right pipeline of AI engines, executes them in sequence, and returns the result — directly in your chat.

No interfaces to learn. No tabs to switch. No prompts to engineer.

---

## The architecture

```
Your message (Telegram, WhatsApp, Web, API)
            │
            ▼
    ┌───────────────┐
    │  Smart Router  │  ← Classifies intent with AI
    └───────┬───────┘
            │
     ┌──────┴──────┐
     ▼             ▼
  Pipeline A    Pipeline B    ...Pipeline N
     │
     ├── 🧠 Analyst Engine     (GPT-4o, Claude, Gemini)
     ├── ⚙️  Engineer Engine    (Claude Sonnet, GPT-4o)
     └── 🚀 Execution Engine   (Netlify, GitHub, APIs)
            │
            ▼
     Result delivered to your chat
```

Every engine communicates through shared memory — not through the chat window. The user only sees the final output.

---

## Pipelines

| Intent | Engines involved | Output |
|--------|-----------------|--------|
| 🌐 **Web** — *"Build a landing page for..."* | Analyst → Engineer → Netlify | Permanent HTTPS URL |
| 📄 **Document** — *"Write a business plan for..."* | Analyst → Writer | Full structured document |
| 💻 **Code** — *"Write a script that..."* | Engineer | Production-ready code |
| 🔍 **Research** — *"Analyze / compare..."* | Researcher → Analyst | Structured insights |
| 🌍 **Translate** — *"Translate this to..."* | Translator | Translated content |
| 💬 **Chat** — anything else | Full krew | Real-time group conversation |

---

## Powered by best-in-class engines

**Language Models**
- [Anthropic Claude](https://anthropic.com) — architecture, engineering, technical reasoning
- [OpenAI GPT-4o](https://openai.com) — analysis, copy, creative tasks
- [Google Gemini](https://deepmind.google) — research, multilingual, multimodal

**Execution & Deployment**
- [Netlify](https://netlify.com) — atomic deployments, global CDN, permanent HTTPS URLs

**Channels** *(connect any)*
- Telegram — included out of the box
- WhatsApp — coming soon
- Web dashboard — coming soon
- REST API — use OpenKrew programmatically

---

## Install

```bash
# Via npm
npm install -g openkrew

# Or clone
git clone https://github.com/Sbadilla99/Open-Krew.git
cd Open-Krew && npm install
```

## Setup

```bash
openkrew setup
```

The interactive wizard connects your engines:

```
📱  Channel          →  Telegram bot token
🧠  Language models  →  Anthropic / OpenAI / Google API keys  
🚀  Deployment       →  Netlify Personal Access Token
```

## Run

```bash
openkrew start
```

---

## Try it

```
"Build a dark SaaS landing page for a product called Novu"

"Write an investor pitch deck outline for a B2B fintech in LATAM"

"Write a Node.js webhook handler that verifies Stripe signatures"

"Compare Stripe vs Adyen vs Conekta for a Mexican e-commerce"

"Translate this privacy policy to Spanish, keep legal tone"
```

---

## Roadmap

- [x] Multi-pipeline router (web, document, code, research, translate)
- [x] Netlify deployment engine
- [x] Telegram channel
- [ ] WhatsApp channel
- [ ] Web dashboard with session history
- [ ] Skills system — custom pipelines as `.krew` files
- [ ] KrewHub — skills marketplace
- [ ] Tool connectors — Gmail, Notion, GitHub, Slack, Stripe
- [ ] Self-hosted proxy with usage analytics

---

## Contributing

OpenKrew is open source and built in public.
PRs, issues, and skill contributions are welcome.

```
github.com/Sbadilla99/Open-Krew
```

---

<div align="center">

Built with ❤️ for the community— open source, runs on your machine. 

*Open source · Runs on your machine · No vendor lock-in*

</div>

---


