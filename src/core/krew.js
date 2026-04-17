// src/core/krew.js
import { KrewGroup } from "./group.js";
import { Moderator } from "./moderator.js";
import { claudeAgent } from "../agents/claude.js";
import { chatgptAgent } from "../agents/chatgpt.js";
import { geminiAgent } from "../agents/gemini.js";
import { e2bConnector } from "../connectors/e2b.js";
import { MemoryStore } from "../memory/store.js";

const AI_AGENTS = { claude: claudeAgent, chatgpt: chatgptAgent, gemini: geminiAgent };
const EXECUTORS = { e2b: e2bConnector };

export class Krew {
  constructor(options = {}) {
    this.group = new KrewGroup(options.groupId || "main");
    this.moderator = new Moderator();
    this.memory = new MemoryStore();
    this.onMessage = options.onMessage || null;
    this.chatId = options.chatId || "default";
    this.activeAgentIds = options.agents || this.detectAvailableAgents();
    this.activeExecutorIds = this.detectAvailableExecutors();
    this.loadHistory();
    for (const id of this.activeAgentIds) { if (AI_AGENTS[id]) this.group.addMember(AI_AGENTS[id]); }
    for (const id of this.activeExecutorIds) { if (EXECUTORS[id]) this.group.addMember(EXECUTORS[id]); }
  }

  detectAvailableAgents() {
    const a = [];
    if (process.env.ANTHROPIC_API_KEY) a.push("claude");
    if (process.env.OPENAI_API_KEY) a.push("chatgpt");
    if (process.env.GEMINI_API_KEY) a.push("gemini");
    return a;
  }

  detectAvailableExecutors() {
    const e = [];
    if (process.env.E2B_API_KEY) e.push("e2b");
    return e;
  }

  loadHistory() {
    const history = this.memory.loadSession(this.chatId);
    if (history.length > 0) {
      this.group.messages = history;
      console.log(`📚 Loaded ${history.length} messages from memory`);
    }
  }

  async chat(userMessage, userId = "user") {
    if (this.group.isProcessing) return;
    this.group.isProcessing = true;
    try {
      const userMsg = this.group.addMessage(userId, userMessage, "user");
      this.moderator.onUserMessage(userMsg.id);
      const facts = this.memory.getFactsAsContext();
      if (facts) this.group.userFacts = facts;
      const respondents = this.group.getRespondents(userMessage);
      if (respondents.length === 0) return;

      // AI agents respond first, then executors
      const aiRespondents = respondents.filter(r => r.type !== "executor");
      const executorRespondents = respondents.filter(r => r.type === "executor");

      // AIs respond in parallel
      const aiResponses = await Promise.allSettled(
        aiRespondents.map(async (agent) => {
          try { return { agent, text: await agent.respond(this.group) }; }
          catch (err) { return { agent, text: `⚠️ Error: ${err.message}` }; }
        })
      );

      // Add AI responses to group history
      for (const result of aiResponses) {
        if (result.status === "fulfilled" && result.value) {
          const { agent, text } = result.value;
          this.group.addMessage(agent.id, text, "assistant");
          this.moderator.onAgentResponse();
          if (this.onMessage) await this.onMessage({ agent, text });
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Executors respond AFTER AIs — they read the full conversation including AI responses
      if (executorRespondents.length > 0) {
        await new Promise(r => setTimeout(r, 800)); // pause before execution
        for (const executor of executorRespondents) {
          try {
            const text = await executor.respond(this.group);
            this.group.addMessage(executor.id, text, "assistant");
            if (this.onMessage) await this.onMessage({ agent: executor, text });
          } catch (err) {
            const errMsg = `⚠️ ${executor.name} error: ${err.message}`;
            if (this.onMessage) await this.onMessage({ agent: executor, text: errMsg });
          }
          await new Promise(r => setTimeout(r, 300));
        }
      }

      this.memory.saveSession(this.chatId, this.group.messages);
    } finally {
      this.group.isProcessing = false;
    }
  }

  remember(fact) { this.memory.saveFact(fact); }
  reset() { this.group.reset(); this.moderator.reset(); this.memory.clearSession(this.chatId); }

  status() {
    const members = [
      ...this.activeAgentIds.map(id => AI_AGENTS[id]).filter(Boolean),
      ...this.activeExecutorIds.map(id => EXECUTORS[id]).filter(Boolean),
    ];
    return {
      members: members.map(a => ({ id: a.id, name: a.name, emoji: a.emoji, type: a.type || "ai" })),
      messageCount: this.group.messages.length,
      isProcessing: this.group.isProcessing,
      hasMemory: this.memory.data.facts.length > 0,
    };
  }
}
