// src/agents/claude.js
import Anthropic from "@anthropic-ai/sdk";

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const claudeAgent = {
  id: "claude",
  name: "Claude",
  emoji: "🟡",
  color: "#D4A853",
  role: "Engineer",

  // Respuesta en grupo (para conversaciones normales)
  async respond(group) {
    const context = group.buildContextFor("claude");
    const facts = group.userFacts || "";

    const system = `You are Claude, the engineer in OpenKrew — a real-time AI group chat.

${facts ? `Context about the user:\n${facts}\n` : ""}

Your role: architecture, strategy, technical decisions, code.
Keep responses concise. This is a live group chat.
When asked to build something, generate clean HTML with Tailwind CSS.`;

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system,
      messages: context.length > 0 ? context : [{ role: "user", content: "Hello" }],
    });
    return response.content[0].text;
  },

  // Respuesta directa para el pipeline (sin group context)
  async respondRaw(messages) {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages,
    });
    return response.content[0].text;
  },
};
