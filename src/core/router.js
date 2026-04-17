// src/core/router.js
// El cerebro de OpenKrew v2.0
// Lee el mensaje y decide qué pipeline ejecutar

import { claudeAgent } from "../agents/claude.js";

// Tipos de pipeline disponibles
export const PIPELINE_TYPES = {
  WEB: "web",           // Build/modify webpages → Netlify
  DOCUMENT: "document", // Write reports, plans, emails, contracts
  CODE: "code",         // Write scripts, functions, code snippets
  RESEARCH: "research", // Analyze, compare, research topics
  TRANSLATE: "translate",// Translate content
  CHAT: "chat",         // Normal conversation
};

// Router rápido basado en keywords (sin llamada a API)
export function quickRoute(message) {
  const m = message.toLowerCase();

  // Web
  const webTriggers = ["build", "create a page", "make a website", "landing page", "webpage", "web app", "deploy", "website for", "site for", "construye", "crea una página", "página web", "sitio web"];
  if (webTriggers.some(t => m.includes(t))) return PIPELINE_TYPES.WEB;

  // Translate
  const translateTriggers = ["translate", "traduce", "traducir", "in english", "in spanish", "en inglés", "en español", "al inglés", "al español"];
  if (translateTriggers.some(t => m.includes(t))) return PIPELINE_TYPES.TRANSLATE;

  // Code
  const codeTriggers = ["write a script", "write code", "function that", "write a function", "python script", "javascript function", "bash script", "escribe un script", "escribe código", "función que"];
  if (codeTriggers.some(t => m.includes(t))) return PIPELINE_TYPES.CODE;

  // Document
  const docTriggers = ["write a", "draft a", "create a report", "business plan", "write an email", "write a contract", "proposal", "redacta", "escribe un", "plan de negocios", "correo", "contrato", "propuesta", "informe"];
  if (docTriggers.some(t => m.includes(t))) return PIPELINE_TYPES.DOCUMENT;

  // Research
  const researchTriggers = ["analyze", "research", "compare", "what are the best", "give me insights", "analiza", "investiga", "compara", "cuáles son", "dame insights", "explícame"];
  if (researchTriggers.some(t => m.includes(t))) return PIPELINE_TYPES.RESEARCH;

  return null; // No match — use AI router
}

// Router con AI — para mensajes ambiguos
export async function aiRoute(message) {
  const prompt = `You are a task router. Classify this user message into exactly ONE category.

Message: "${message}"

Categories:
- web: building or modifying websites, landing pages, web apps
- document: writing reports, business plans, emails, contracts, proposals, summaries
- code: writing scripts, functions, code snippets, automation
- research: analyzing, comparing, researching topics, giving insights
- translate: translating content between languages
- chat: general conversation, questions, anything else

Respond with ONLY the category name, nothing else. No explanation.`;

  try {
    const result = await claudeAgent.respondRaw([{ role: "user", content: prompt }]);
    const category = result.trim().toLowerCase();
    if (Object.values(PIPELINE_TYPES).includes(category)) return category;
    return PIPELINE_TYPES.CHAT;
  } catch {
    return PIPELINE_TYPES.CHAT;
  }
}

// Router principal — primero rápido, luego AI si no hay match
export async function route(message) {
  const quick = quickRoute(message);
  if (quick) return quick;
  return await aiRoute(message);
}
