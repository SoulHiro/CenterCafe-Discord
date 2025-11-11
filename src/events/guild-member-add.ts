import { GuildMember, TextChannel, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../utils/embeds';
import { Logger } from '../utils/logger';
import { 
  registerMemberJoin, 
  detectRaid, 
  quarantineMember, 
  logAntiRaidAction 
} from './anti-raid';

const WELCOME_CHANNEL_ID = '1404485327242133625';
const AUTO_ROLE_ID = '1061343817812426857';
const SUSPICIOUS_LOG_CHANNEL_ID = '1209563901042368662';
const QUARANTINE_ROLE_ID = '1209563736780705863';

// Janela mínima de idade de conta para permitir entrada (2 dias)
const accountMinAgeMs = 2 * 24 * 60 * 60 * 1000;

function formatAccountAge(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

async function quarantineIfNewAccount(member: GuildMember): Promise<boolean> {
  try {
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      Logger.warning('Bot sem permissão para gerenciar cargos.');
      return false;
    }

    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    if (accountAgeMs < accountMinAgeMs) {
      const quarantineRole = member.guild.roles.cache.get(QUARANTINE_ROLE_ID);
      if (!quarantineRole) {
        Logger.warning(`Cargo de quarentena com ID ${QUARANTINE_ROLE_ID} não encontrado.`);
        return false;
      }

      await member.roles.add(quarantineRole, 'Atividade suspeita detectada (conta nova)');

      const notifyChannel = member.guild.channels.cache.get(SUSPICIOUS_LOG_CHANNEL_ID) as TextChannel;
      if (notifyChannel && notifyChannel.isTextBased()) {
        const content = `🔒 Usuário <@${member.user.id}> colocado em quarentena (conta nova).\n🕒 Idade da conta: ${formatAccountAge(accountAgeMs)}\n🆔 ID: ${member.user.id}\nMotivo: Atividade suspeita detectada`;
        await notifyChannel.send({ content, allowedMentions: { users: [member.user.id] } });
      } else {
        Logger.warning(`Canal de logs suspeitos com ID ${SUSPICIOUS_LOG_CHANNEL_ID} não encontrado`);
      }

      Logger.warning(`Membro ${member.user.tag} colocado em quarentena por conta jovem (${formatAccountAge(accountAgeMs)})`);
      return true;
    }
    return false;
  } catch (error) {
    Logger.error(`Erro ao aplicar quarentena por conta jovem ${member.user.tag}: ${error}`);
    return false;
  }
}

export async function handleGuildMemberAdd(member: GuildMember) {
  try {
    // === SISTEMA ANTI-RAID ===
    // Registrar entrada do membro
    registerMemberJoin(member);

    // Quarentena automática para contas criadas há menos de 2 dias
    const quarantinedForYoungAccount = await quarantineIfNewAccount(member);
    if (quarantinedForYoungAccount) {
      return;
    }
    
    // Verificar se há raid em andamento
    const isRaid = detectRaid(member.guild);
    
    if (isRaid) {
      // Log do raid detectado
      await logAntiRaidAction(member.guild, {
        type: "RAID_DETECTED",
        reason: "Muitos membros entrando rapidamente",
        details: `Membro que ativou: ${member.user.tag} (${member.user.id})`
      });
      
      // Colocar o membro em quarentena
      const quarantined = await quarantineMember(member);
      
      if (quarantined) {
        await logAntiRaidAction(member.guild, {
          type: "MEMBER_QUARANTINED",
          member: member.user,
          reason: "Entrada durante raid detectado"
        });
        
        Logger.warning(`🔒 Membro ${member.user.tag} colocado em quarentena (raid detectado)`);
        
        // Não continuar com boas-vindas se em quarentena
        return;
      }
    }

    // === PROCESSO NORMAL DE BOAS-VINDAS ===
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
        content: `<@${member.user.id}> | <@1218655247166210069>`, 
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