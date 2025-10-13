import { 
  GuildMember, 
  TextChannel, 
  EmbedBuilder, 
  PermissionFlagsBits,
  Guild,
  User
} from "discord.js";

// Configurações do sistema anti-raid
const RAID_CONFIG = {
  // Máximo de membros que podem entrar em um período
  maxMembersPerInterval: 5,
  // Intervalo de tempo em milissegundos (5 minutos)
  timeInterval: 5 * 60 * 1000,
  // Tempo de quarentena em milissegundos (10 minutos)
  quarantineTime: 10 * 60 * 1000,
  // ID do canal de logs específico
  logChannelId: "1061343818504474740"
};

// Armazenar entradas recentes de membros
const memberJoins = new Map<string, number[]>();
// Membros em quarentena
const quarantinedMembers = new Set<string>();

/**
 * Detecta possível raid baseado na velocidade de entrada de membros
 */
export function detectRaid(guild: Guild): boolean {
  const guildId = guild.id;
  const now = Date.now();
  
  // Obter entradas recentes
  const recentJoins = memberJoins.get(guildId) || [];
  
  // Filtrar apenas entradas dentro do intervalo de tempo
  const validJoins = recentJoins.filter(
    joinTime => now - joinTime <= RAID_CONFIG.timeInterval
  );
  
  // Atualizar o mapa com entradas válidas
  memberJoins.set(guildId, validJoins);
  
  // Verificar se excedeu o limite
  return validJoins.length >= RAID_CONFIG.maxMembersPerInterval;
}

/**
 * Registra a entrada de um novo membro
 */
export function registerMemberJoin(member: GuildMember): void {
  const guildId = member.guild.id;
  const now = Date.now();
  
  // Obter entradas existentes
  const joins = memberJoins.get(guildId) || [];
  joins.push(now);
  
  // Manter apenas entradas recentes
  const validJoins = joins.filter(
    joinTime => now - joinTime <= RAID_CONFIG.timeInterval
  );
  
  memberJoins.set(guildId, validJoins);
}

/**
 * Coloca um membro em quarentena
 */
export async function quarantineMember(member: GuildMember): Promise<boolean> {
  try {
    // Verificar se o bot tem permissões
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      console.log("❌ Bot não tem permissão para gerenciar cargos");
      return false;
    }

    // Procurar ou criar cargo de quarentena
    let quarantineRole = member.guild.roles.cache.find(
      role => role.name === "🔒 Quarentena"
    );

    if (!quarantineRole) {
      quarantineRole = await member.guild.roles.create({
        name: "🔒 Quarentena",
        color: 0x808080,
        permissions: [],
        reason: "Cargo de quarentena anti-raid"
      });

      // Configurar permissões do cargo em todos os canais
      const channels = member.guild.channels.cache;
      for (const channel of channels.values()) {
        if (channel.isTextBased() || channel.isVoiceBased()) {
          try {
            // Verificar se o canal suporta permissionOverwrites
            if ('permissionOverwrites' in channel) {
              await channel.permissionOverwrites.create(quarantineRole, {
                SendMessages: false,
                Speak: false,
                Connect: false,
                AddReactions: false,
                UseApplicationCommands: false
              });
            }
          } catch (error) {
            console.log(`Erro ao configurar permissões no canal ${channel.name}:`, error);
          }
        }
      }
    }

    // Adicionar cargo ao membro
    await member.roles.add(quarantineRole, "Quarentena anti-raid automática");
    
    // Marcar como em quarentena
    quarantinedMembers.add(member.id);
    
    // Remover quarentena após o tempo configurado
    setTimeout(async () => {
      try {
        if (member.guild.members.cache.has(member.id)) {
          await member.roles.remove(quarantineRole!, "Fim da quarentena anti-raid");
          quarantinedMembers.delete(member.id);
          
          // Log de liberação
          await logAntiRaidAction(member.guild, {
            type: "QUARANTINE_RELEASED",
            member: member.user,
            reason: "Tempo de quarentena expirado"
          });
        }
      } catch (error) {
        console.error("Erro ao remover quarentena:", error);
      }
    }, RAID_CONFIG.quarantineTime);

    return true;
  } catch (error) {
    console.error("Erro ao colocar membro em quarentena:", error);
    return false;
  }
}

/**
 * Verifica se um membro está em quarentena
 */
export function isInQuarantine(memberId: string): boolean {
  return quarantinedMembers.has(memberId);
}

/**
 * Remove manualmente um membro da quarentena
 */
export async function removeFromQuarantine(member: GuildMember): Promise<boolean> {
  try {
    const quarantineRole = member.guild.roles.cache.find(
      role => role.name === "🔒 Quarentena"
    );

    if (quarantineRole && member.roles.cache.has(quarantineRole.id)) {
      await member.roles.remove(quarantineRole, "Remoção manual da quarentena");
      quarantinedMembers.delete(member.id);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao remover quarentena manualmente:", error);
    return false;
  }
}

/**
 * Registra ações do sistema anti-raid
 */
export async function logAntiRaidAction(
  guild: Guild, 
  action: {
    type: "RAID_DETECTED" | "MEMBER_QUARANTINED" | "QUARANTINE_RELEASED" | "MANUAL_ACTION";
    member?: User;
    reason: string;
    details?: string;
  }
): Promise<void> {
  try {
    // Buscar canal de logs pelo ID específico
    const logChannel = guild.channels.cache.get(RAID_CONFIG.logChannelId) as TextChannel;

    if (!logChannel || !logChannel.isTextBased()) {
      console.log(`Canal de logs anti-raid não encontrado (ID: ${RAID_CONFIG.logChannelId})`);
      return;
    }

    // Criar embed do log
    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: "Sistema Anti-Raid" });

    switch (action.type) {
      case "RAID_DETECTED":
        embed
          .setTitle("🚨 RAID DETECTADO")
          .setColor(0xFF0000)
          .setDescription(`**Motivo:** ${action.reason}`)
          .addFields({
            name: "📊 Estatísticas",
            value: `**Entradas recentes:** ${memberJoins.get(guild.id)?.length || 0}\n**Limite:** ${RAID_CONFIG.maxMembersPerInterval}\n**Intervalo:** ${RAID_CONFIG.timeInterval / 60000} minutos`
          });
        break;

      case "MEMBER_QUARANTINED":
        embed
          .setTitle("🔒 Membro em Quarentena")
          .setColor(0xFFA500)
          .setDescription(`**Usuário:** ${action.member?.tag}\n**ID:** ${action.member?.id}`)
          .addFields({
            name: "📋 Detalhes",
            value: `**Motivo:** ${action.reason}\n**Duração:** ${RAID_CONFIG.quarantineTime / 60000} minutos`
          });
        break;

      case "QUARANTINE_RELEASED":
        embed
          .setTitle("✅ Quarentena Liberada")
          .setColor(0x00FF00)
          .setDescription(`**Usuário:** ${action.member?.tag}\n**ID:** ${action.member?.id}`)
          .addFields({
            name: "📋 Motivo",
            value: action.reason
          });
        break;

      case "MANUAL_ACTION":
        embed
          .setTitle("⚙️ Ação Manual")
          .setColor(0x0099FF)
          .setDescription(`**Usuário:** ${action.member?.tag || "N/A"}\n**Ação:** ${action.reason}`)
          .addFields({
            name: "📋 Detalhes",
            value: action.details || "Nenhum detalhe adicional"
          });
        break;
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Erro ao registrar log anti-raid:", error);
  }
}

/**
 * Obtém estatísticas do sistema anti-raid
 */
export function getAntiRaidStats(guildId: string) {
  const recentJoins = memberJoins.get(guildId) || [];
  const now = Date.now();
  
  const validJoins = recentJoins.filter(
    joinTime => now - joinTime <= RAID_CONFIG.timeInterval
  );

  return {
    recentJoins: validJoins.length,
    maxAllowed: RAID_CONFIG.maxMembersPerInterval,
    timeWindow: RAID_CONFIG.timeInterval / 60000, // em minutos
    quarantinedCount: quarantinedMembers.size,
    isRaidDetected: validJoins.length >= RAID_CONFIG.maxMembersPerInterval
  };
}