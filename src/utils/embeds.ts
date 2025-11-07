import { EmbedBuilder } from "discord.js";

export class EmbedUtils {
  static createWelcomeEmbed(
    username: string,
    memberCount: number
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("☕ Bem-vindo ao Center Café!")
      .setDescription(
        `Olá **${username}**! É um prazer ter você aqui.  
Aqui no Center Café criamos um ambiente acolhedor para estudar, conversar e fazer novas amizades.  
Antes de começar, dê uma olhada nesses passos rápidos:`
      )
      .setColor(0x8b4513)
      .setThumbnail(
        "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnF2MXJ2NTQ3b3JudW1pbDZndGZ1OGU3bW1xYmwydWE0NHJ6ZDluaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bcKmIWkUMCjVm/giphy.gif"
      )
      .addFields(
        {
          name: "📋 1. Leia as Regras",
          value: `Para garantir uma boa convivência, confira: <#1061343818999414825>`,
        },
        {
          name: "🎨 2. Escolha sua Cor",
          value: `Personalize seu perfil em: <#1061343818999414829>`,
        },
        {
          name: "👤 3. Apresente-se",
          value: `Queremos te conhecer! Passe em: <#1069096204161527858>`,
        }
      )
      .setFooter({
        text: `Você é o membro #${memberCount} • Center Café`,
        iconURL: "https://cdn.discordapp.com/emojis/1234567890123456789.png",
      })
      .setTimestamp();
  }

  static createStartupEmbed(client?: any): EmbedBuilder {
    const guildCount = client?.guilds?.cache?.size || 0;
    const userCount =
      client?.guilds?.cache?.reduce(
        (acc: number, guild: any) => acc + guild.memberCount,
        0
      ) || 0;
    const startTime = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return new EmbedBuilder()
      .setTitle("🤖 Center Café Bot - Sistema Online!")
      .setDescription(
        "☕ **Bem-vindos ao Center Café!** ☕\n\n" +
          "O bot foi inicializado com sucesso e todos os sistemas estão operacionais. " +
          "Estou pronto para servir a melhor experiência digital para nossa comunidade!"
      )
      .setColor(0x8b4513) // Cor marrom café
      .addFields(
        {
          name: "📊 Estatísticas do Servidor",
          value: `**Servidores:** ${guildCount}\n**Usuários:** ${userCount.toLocaleString(
            "pt-BR"
          )}\n**Status:** 🟢 Online`,
          inline: true,
        },
        {
          name: "⚙️ Informações Técnicas",
          value: `**Versão:** 2.0.0\n**Sistema:** Discord.js v14\n**Uptime:** Recém iniciado`,
          inline: true,
        },
        {
          name: "🕒 Inicialização",
          value: `**Horário:** ${startTime}\n**Fuso:** UTC-3 (São Paulo)\n**Ambiente:** ${
            process.env.NODE_ENV || "development"
          }`,
          inline: true,
        },
        {
          name: "🎯 Funcionalidades Principais",
          value:
            "🎮 **Entretenimento**\n" +
            "• Jogo da Velha interativo\n" +
            "• Sistema de respostas inteligentes\n" +
            "• Mensagens programadas\n\n" +
            "🛡️ **Segurança & Moderação**\n" +
            "• Sistema Anti-Raid avançado\n" +
            "• Quarentena automática\n" +
            "• Logs detalhados de atividades\n\n" +
            "👋 **Gestão de Comunidade**\n" +
            "• Boas-vindas personalizadas\n" +
            "• Atribuição automática de cargos\n" +
            "• Comandos administrativos completos",
          inline: false,
        },
        {
          name: "📋 Comandos Disponíveis",
          value:
            "`/ping` - Verificar latência\n" +
            "`/avatar` - Visualizar avatar de usuários\n" +
            "`/userinfo` - Informações detalhadas de usuários\n" +
            "`/serverinfo` - Estatísticas do servidor\n" +
            "`/jogo-da-velha` - Iniciar partida interativa\n" +
            "`/antiraid` - Gerenciar sistema de segurança\n" +
            "`/clear` - Limpar mensagens (moderadores)\n" +
            "`/update-commands` - Atualizar comandos (admin)",
          inline: false,
        }
      )
      .setThumbnail("https://cdn.discordapp.com/emojis/☕.png") // Emoji de café
      .setFooter({
        text: "Center Café Bot • Hello World",
        iconURL: client?.user?.displayAvatarURL(),
      })
      .setTimestamp();
  }

  static createErrorEmbed(error: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("❌ Erro")
      .setDescription(error)
      .setColor(0xff0000)
      .setTimestamp();
  }

  static createSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("✅ Sucesso")
      .setDescription(message)
      .setColor(0x00ff00)
      .setTimestamp();
  }
}
