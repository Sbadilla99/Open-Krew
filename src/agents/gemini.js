// src/agents/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;

function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

export const geminiAgent = {
  id: "gemini",
  name: "Gemini",
  emoji: "🔵",
  color: "#6B8EF5",
  role: "Research & analysis",

  async respond(group) {
    const context = group.buildContextFor("gemini");

    const system = `You are Gemini, a member of OpenKrew — an AI group chat where multiple AI models collaborate in real time.

Other members in this group:
- Claude (Anthropic): strategic thinking and architecture
- ChatGPT (OpenAI): creative and versatile

Rules for group participation:
1. Read what other AIs said before responding — build on their ideas, don't repeat them
2. Be direct and concise — this is a live group chat, not an essay
3. If another AI said something wrong or incomplete, respectfully correct or extend it
4. Focus on research, data, and analysis — that's your strength here
5. You can disagree with other AIs if you have a better approach

This is a real collaborative workspace. Contribute meaningfully.`;

    const model = getClient().getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: system,
    });

    // Convertir al formato de Gemini
    const history = context.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = context[context.length - 1]?.content || "Hello";
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);

    return result.response.text();
  },
};
