import { Message } from 'discord.js';

const responses = [
  "☕ Ei! Precisa de ajuda? Experimente `/welcome-preview`.",
  "🤖 Fui mencionado! Posso fazer um ping: `/ping`.",
  "📚 Veja meus comandos: `/welcome-preview`, `/update-commands`, `/ping`.",
  "🎉 Opa! Adoro um café. O que mandou?",
  "💡 Dica: use `/update-commands` para atualizar meus comandos.",
  "🧭 Quer explorar? `/welcome-preview` mostra a mensagem de boas-vindas!",
];

export async function handleMention(message: Message) {
  try {
    // Ignora mensagens de bots
    if (message.author.bot) return;

    const botId = message.client.user?.id;
    if (!botId) return;

    // Verifica se o bot foi mencionado
    const isMentioned = message.mentions.users.has(botId);
    if (!isMentioned) return;

    // Escolhe uma resposta aleatória
    const reply = responses[Math.floor(Math.random() * responses.length)];
    await message.reply({ content: reply });
  } catch (error) {
    // Silencioso para não poluir logs; poderia usar um logger se necessário
  }
}