// src/connectors/e2b.js
import { Sandbox } from "@e2b/code-interpreter";

export const e2bConnector = {
  id: "e2b",
  name: "E2B",
  emoji: "⚡",
  color: "#F59E0B",
  role: "Code executor & UI builder",
  type: "executor",

  isConfigured() {
    return !!process.env.E2B_API_KEY;
  },

  // Ejecuta código simple
  async runCode(code) {
    try {
      const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
      const execution = await sandbox.runCode(code);
      await sandbox.kill();
      return { success: true, output: execution.text || "" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Deploy HTML estático — método más simple y confiable
  async deployHTML(html) {
    try {
      // Crear sandbox sin timeout en el sandbox mismo
      const sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY,
      });

      // Escribir el archivo HTML
      await sandbox.files.write("/home/user/index.html", html);

      // Arrancar servidor HTTP en background — NO esperamos que termine
      // Usamos nohup para que corra independiente
      await sandbox.commands.run(
        "nohup python3 -m http.server 3000 --directory /home/user > /tmp/server.log 2>&1 &",
        { timeoutMs: 5000 } // solo 5s para lanzar, no para correr
      );

      // Dar tiempo al servidor para arrancar
      await new Promise(r => setTimeout(r, 3000));

      const host = sandbox.getHost(3000);

      // Sandbox vive 10 minutos
      setTimeout(() => sandbox.kill().catch(() => {}), 10 * 60 * 1000);

      return {
        success: true,
        url: `https://${host}`,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Extrae bloques de código HTML o JSX de los mensajes
  extractCode(messages) {
    const blocks = [];
    for (const msg of messages) {
      const matches = msg.text?.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
      for (const block of matches) {
        const lang = block.match(/```(\w+)/)?.[1] || "html";
        const code = block.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
        if (code.length > 50) blocks.push({ lang, code });
      }
    }
    return blocks;
  },

  needsExecution(messages) {
    const last = messages.slice(-6);
    const triggers = ["deploy", "build", "execute", "landing page", "webpage", "website", "page"];
    return last.some(m => triggers.some(t => m.text?.toLowerCase().includes(t)));
  },

  async respond(group) {
    if (!this.isConfigured()) {
      return "⚠️ Not connected. Add E2B_API_KEY to .env — get your free key at e2b.dev";
    }

    const messages = group.messages;
    const codeBlocks = this.extractCode(messages);

    // Buscar HTML completo primero (más fácil de deployar)
    const htmlBlock = codeBlocks.find(b =>
      b.lang === "html" ||
      b.code.includes("<!DOCTYPE") ||
      b.code.includes("<html")
    );

    if (htmlBlock) {
      const result = await this.deployHTML(htmlBlock.code);
      if (result.success) {
        return `✅ *Deployed and live!*\n\n🔗 ${result.url}\n\n_Available for 10 minutes._`;
      }
      return `❌ Deploy failed: ${result.error}`;
    }

    // Buscar JSX/React — convertir a HTML con Babel CDN
    const jsxBlock = codeBlocks.find(b =>
      b.lang === "jsx" || b.lang === "tsx" ||
      (b.code.includes("function ") && b.code.includes("return ("))
    );

    if (jsxBlock) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
    ${jsxBlock.code}
    const rootEl = document.getElementById('root');
    ReactDOM.createRoot(rootEl).render(React.createElement(App));
  </script>
</body>
</html>`;

      const result = await this.deployHTML(html);
      if (result.success) {
        return `✅ *Deployed and live!*\n\n🔗 ${result.url}\n\n_Available for 10 minutes._`;
      }
      return `❌ Deploy failed: ${result.error}`;
    }

    if (this.needsExecution(messages)) {
      return "⚡ Ready to deploy. Ask the krew to generate the code as HTML or JSX and I'll get it live.";
    }

    return "⚡ Ready to execute and deploy. Ask your krew to build something!";
  },
};
