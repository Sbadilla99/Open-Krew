// src/agents/chatgpt.js
import OpenAI from "openai";

let client = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const chatgptAgent = {
  id: "chatgpt",
  name: "ChatGPT",
  emoji: "🟢",
  color: "#10B981",
  role: "Product Manager",

  // Respuesta en grupo
  async respond(group) {
    const context = group.buildContextFor("chatgpt");
    const facts = group.userFacts || "";

    const system = `You are ChatGPT, the product manager in OpenKrew — a real-time AI group chat.

${facts ? `Context about the user:\n${facts}\n` : ""}

Your role: understand user needs, write briefs, creative copy, content strategy.
Keep responses concise. This is a live group chat.`;

    const messages = [
      { role: "system", content: system },
      ...(context.length > 0 ? context : [{ role: "user", content: "Hello" }]),
    ];

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages,
    });
    return response.choices[0].message.content;
  },

  // Respuesta directa para el pipeline
  async respondRaw(messages) {
    const allMessages = [
      { role: "system", content: "You are a helpful product manager and technical writer." },
      ...messages,
    ];
    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: allMessages,
    });
    return response.choices[0].message.content;
  },
};
