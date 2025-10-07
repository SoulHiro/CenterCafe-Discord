import { EmbedBuilder } from 'discord.js';

export class EmbedUtils {
  static createWelcomeEmbed(username: string, memberCount: number): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('☕ Bem-vindo ao Center Café!')
      .setDescription(`Olá **${username}**! Seja muito bem-vindo(a) ao nosso servidor! ☕\n\nAqui você encontrará uma comunidade acolhedora e cheia de boas conversas. Sinta-se à vontade para interagir e fazer novos amigos!`)
      .setColor(0x8B4513)
      .setImage('https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnF2MXJ2NTQ3b3JudW1pbDZndGZ1OGU3bW1xYmwydWE0NHJ6ZDluaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bcKmIWkUMCjVm/giphy.gif')
      .addFields(
        { name: '📋 Regras', value: 'Leia nossas regras para uma convivência harmoniosa', inline: true },
        { name: '💬 Canais', value: 'Explore nossos canais e participe das conversas', inline: true },
        { name: '🎉 Diversão', value: 'Aproveite os jogos e atividades do servidor', inline: true }
      )
      .setFooter({ 
        text: `Você é o membro #${memberCount} • Center Café`, 
        iconURL: 'https://cdn.discordapp.com/emojis/1234567890123456789.png' 
      })
      .setTimestamp();
  }

  static createStartupEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🤖 Center Café Bot - Online!')
      .setDescription('O bot foi iniciado com sucesso e está pronto para servir o melhor café digital! ☕')
      .setColor(0x00FF00)
      .addFields(
        { name: '⚡ Status', value: 'Online e funcionando', inline: true },
        { name: '🔧 Versão', value: '1.0.0', inline: true },
        { name: '📊 Sistema', value: 'Discord.js v14', inline: true },
        { name: '🎯 Funcionalidades', value: '• Boas-vindas automáticas\n• Comandos slash\n• Sistema de cargos\n• Logs detalhados', inline: false }
      )
      .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png')
      .setFooter({ text: 'Center Café Bot • Desenvolvido com ❤️' })
      .setTimestamp();
  }

  static createErrorEmbed(error: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('❌ Erro')
      .setDescription(error)
      .setColor(0xFF0000)
      .setTimestamp();
  }

  static createSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('✅ Sucesso')
      .setDescription(message)
      .setColor(0x00FF00)
      .setTimestamp();
  }
}