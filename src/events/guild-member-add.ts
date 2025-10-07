import { GuildMember, TextChannel } from 'discord.js';
import { EmbedUtils } from '../utils/embeds';
import { Logger } from '../utils/logger';

const WELCOME_CHANNEL_ID = '1404485327242133625';
const AUTO_ROLE_ID = '1061343817812426857';

export async function handleGuildMemberAdd(member: GuildMember) {
  try {
    // Atribuir cargo automaticamente
    const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
    if (role) {
      await member.roles.add(role);
      Logger.success(`Cargo ${role.name} atribuído automaticamente para ${member.user.tag}`);
    } else {
      Logger.warning(`Cargo com ID ${AUTO_ROLE_ID} não encontrado`);
    }

    // Enviar mensagem de boas-vindas
    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) as TextChannel;
    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const memberCount = member.guild.memberCount;
      const welcomeEmbed = EmbedUtils.createWelcomeEmbed(member.user.username, memberCount);
      
      await welcomeChannel.send({ 
        content: `<@${member.user.id}>`, 
        embeds: [welcomeEmbed] 
      });
      
      Logger.success(`Mensagem de boas-vindas enviada para ${member.user.tag}`);
    } else {
      Logger.warning(`Canal de boas-vindas com ID ${WELCOME_CHANNEL_ID} não encontrado`);
    }
  } catch (error) {
    Logger.error(`Erro ao processar novo membro ${member.user.tag}: ${error}`);
  }
}