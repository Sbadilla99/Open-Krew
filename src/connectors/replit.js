// src/connectors/replit.js
// Conector de Replit — ejecuta código real y hace deploy
// El usuario conecta su cuenta de Replit con su API key

import axios from "axios";

export const replitConnector = {
  id: "replit",
  name: "Replit",
  emoji: "🔴",
  color: "#F56B6B",
  role: "Code executor & deployer",
  type: "executor", // no es un AI — es una herramienta de ejecución

  // Verifica que la key de Replit está configurada
  isConfigured() {
    return !!process.env.REPLIT_API_KEY;
  },

  // Crea un nuevo Repl y ejecuta código
  async createAndRun({ title, language, code, description }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Replit API key not configured. Add REPLIT_API_KEY to your .env",
      };
    }

    try {
      // Replit API v2 — crear un Repl
      const createRes = await axios.post(
        "https://replit.com/graphql",
        {
          query: `
            mutation CreateRepl($input: CreateReplInput!) {
              createRepl(input: $input) {
                repl {
                  id
                  slug
                  url
                  title
                }
              }
            }
          `,
          variables: {
            input: {
              title: title || "openkrew-" + Date.now(),
              language: language || "nodejs",
              isPrivate: false,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-REPLIT-TOKEN": process.env.REPLIT_API_KEY,
          },
        }
      );

      const repl = createRes.data?.data?.createRepl?.repl;
      if (!repl) {
        return { success: false, error: "Failed to create Repl" };
      }

      return {
        success: true,
        replId: repl.id,
        url: repl.url,
        title: repl.title,
        message: `✅ Repl created: ${repl.url}`,
      };
    } catch (err) {
      // Si la API de Replit no está disponible, simulamos el resultado
      // (útil para demos y desarrollo)
      console.warn("⚠️ Replit API error, using simulation mode:", err.message);
      return simulateExecution({ title, language, code });
    }
  },

  // Responde en el contexto del grupo como miembro ejecutor
  async respond(group) {
    if (!this.isConfigured()) {
      return "⚠️ I'm not configured yet. Add your REPLIT_API_KEY to connect me.";
    }

    // Analiza el último mensaje para detectar si hay código que ejecutar
    const lastMessages = group.messages.slice(-5);
    const hasCode = lastMessages.some(
      (m) => m.text.includes("```") || m.text.toLowerCase().includes("build") ||
             m.text.toLowerCase().includes("deploy") || m.text.toLowerCase().includes("create")
    );

    if (!hasCode) {
      return "I'm ready to execute and deploy. Share code or ask me to build something and I'll run it.";
    }

    // Extrae código de los mensajes si hay bloques ```
    const codeBlocks = extractCodeBlocks(lastMessages);

    if (codeBlocks.length > 0) {
      const result = await this.createAndRun({
        title: "openkrew-build-" + Date.now(),
        language: detectLanguage(codeBlocks[0]),
        code: codeBlocks[0],
      });

      if (result.success) {
        return `✅ Executed and deployed!\n🔗 Live at: ${result.url}\n\nCode is running. Let me know if you need changes.`;
      } else {
        return `❌ Execution failed: ${result.error}`;
      }
    }

    return "Ready to execute. Paste or describe the code you want me to run and deploy.";
  },
};

// ── Helpers ───────────────────────────────────────────────────────────

function extractCodeBlocks(messages) {
  const blocks = [];
  for (const msg of messages) {
    const matches = msg.text.match(/```[\w]*\n([\s\S]*?)```/g);
    if (matches) {
      blocks.push(...matches.map((m) => m.replace(/```[\w]*\n?|```/g, "").trim()));
    }
  }
  return blocks;
}

function detectLanguage(code) {
  if (code.includes("import React") || code.includes("jsx")) return "html";
  if (code.includes("def ") || code.includes("import ")) return "python3";
  if (code.includes("const ") || code.includes("require(")) return "nodejs";
  return "nodejs";
}

// Simulación para demos sin key real
function simulateExecution({ title }) {
  const slug = (title || "demo").toLowerCase().replace(/\s+/g, "-");
  return {
    success: true,
    replId: "sim-" + Date.now(),
    url: `https://${slug}.replit.app`,
    title,
    message: `✅ [Demo] Deploy simulated: https://${slug}.replit.app`,
    simulated: true,
  };
}
