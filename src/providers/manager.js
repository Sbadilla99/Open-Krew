// src/providers/manager.js
// Maneja dos modos de conexión:
// 1. OpenKrew API — vos proveés la API con markup
// 2. BYOK — el usuario trae su propia key

export const CONNECTION_MODES = {
  OPENKREW: "openkrew_api",  // pagás por uso a OpenKrew
  BYOK: "byok",              // traés tu propia key
};

export class ProviderManager {
  constructor(config) {
    this.config = config; // viene de .krew/config.json
  }

  // Retorna el API key correcto para cada agente
  getApiKey(agentId) {
    const agentConfig = this.config.agents?.[agentId];
    if (!agentConfig) return null;

    // Modo BYOK — usa la key del usuario
    if (agentConfig.mode === CONNECTION_MODES.BYOK) {
      return agentConfig.apiKey;
    }

    // Modo OpenKrew API — usa nuestra key maestra con el token del usuario
    if (agentConfig.mode === CONNECTION_MODES.OPENKREW) {
      return process.env.OPENKREW_MASTER_KEY; // tu key con volumen
    }

    return null;
  }

  // Retorna la base URL para el agente
  // En modo OpenKrew API apunta a nuestro proxy
  getBaseUrl(agentId) {
    const agentConfig = this.config.agents?.[agentId];
    if (!agentConfig) return null;

    if (agentConfig.mode === CONNECTION_MODES.OPENKREW) {
      // En producción esto apunta a tu servidor proxy
      // que hace la llamada real y trackea el uso
      return process.env.OPENKREW_PROXY_URL || null;
    }

    return null; // BYOK usa el endpoint oficial del proveedor
  }

  // ¿Está configurado este agente?
  isConfigured(agentId) {
    const key = this.getApiKey(agentId);
    return !!key;
  }

  // Resumen de configuración para mostrar al usuario
  summary() {
    const agents = this.config.agents || {};
    return Object.entries(agents).map(([id, cfg]) => ({
      id,
      mode: cfg.mode,
      model: cfg.model,
      configured: this.isConfigured(id),
    }));
  }
}

// Config por defecto — se genera en setup
export function defaultConfig() {
  return {
    version: "0.1.0",
    agents: {
      claude: {
        mode: CONNECTION_MODES.BYOK,
        apiKey: "",
        model: "claude-sonnet-4-20250514",
        enabled: false,
      },
      chatgpt: {
        mode: CONNECTION_MODES.BYOK,
        apiKey: "",
        model: "gpt-4o",
        enabled: false,
      },
      gemini: {
        mode: CONNECTION_MODES.BYOK,
        apiKey: "",
        model: "gemini-1.5-pro",
        enabled: false,
      },
    },
    telegram: {
      botToken: "",
    },
    replit: {
      enabled: false,
      apiKey: "",
    },
  };
}
