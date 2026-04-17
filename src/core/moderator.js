// src/core/moderator.js
// El moderador — evita que los AIs se respondan entre sí para siempre
// Decide cuándo el grupo "cerró" un tema y cuándo parar

export class Moderator {
  constructor() {
    this.maxRounds = 3;      // máximo de rondas de debate entre AIs
    this.currentRound = 0;
    this.lastUserMessageId = null;
  }

  // Registra un nuevo mensaje del usuario — resetea el contador
  onUserMessage(messageId) {
    this.lastUserMessageId = messageId;
    this.currentRound = 0;
  }

  // ¿Deben los AIs responder a esto?
  shouldRespond(triggerMessage) {
    // Siempre responden a mensajes del usuario
    if (triggerMessage.from === "user") return true;

    // Los AIs responden a otros AIs máximo `maxRounds` veces
    if (this.currentRound >= this.maxRounds) {
      console.log(`🛑 Moderador: máximo de rondas alcanzado (${this.maxRounds})`);
      return false;
    }

    return true;
  }

  // Registra que un AI respondió — incrementa el contador
  onAgentResponse() {
    this.currentRound++;
  }

  // Resetea para el próximo intercambio
  reset() {
    this.currentRound = 0;
  }
}
