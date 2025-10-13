import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember
} from "discord.js";
import { 
  getAntiRaidStats, 
  removeFromQuarantine, 
  isInQuarantine,
  logAntiRaidAction 
} from "../events/anti-raid";

export const data = new SlashCommandBuilder()
  .setName("antiraid")
  .setDescription("Comandos para gerenciar o sistema anti-raid")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName("status")
      .setDescription("Mostra o status atual do sistema anti-raid")
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName("liberar")
      .setDescription("Remove um membro da quarentena")
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuário para remover da quarentena")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName("verificar")
      .setDescription("Verifica se um usuário está em quarentena")
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuário para verificar")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Este comando só pode ser usado em servidores.",
        ephemeral: true,
      });
      return;
    }

    // Verificar permissões
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: "❌ Você precisa da permissão **Gerenciar Servidor** para usar este comando.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "status":
        await handleStatusCommand(interaction);
        break;
      case "liberar":
        await handleLiberarCommand(interaction);
        break;
      case "verificar":
        await handleVerificarCommand(interaction);
        break;
      default:
        await interaction.reply({
          content: "❌ Subcomando não reconhecido.",
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error("Erro no comando antiraid:", error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao executar o comando.",
      ephemeral: true,
    });
  }
}

async function handleStatusCommand(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const stats = getAntiRaidStats(guild.id);

  const embed = new EmbedBuilder()
    .setTitle("🛡️ Status do Sistema Anti-Raid")
    .setColor(stats.isRaidDetected ? 0xFF0000 : 0x00FF00)
    .addFields(
      {
        name: "📊 Estatísticas Atuais",
        value: `**Entradas recentes:** ${stats.recentJoins}/${stats.maxAllowed}\n**Janela de tempo:** ${stats.timeWindow} minutos\n**Membros em quarentena:** ${stats.quarantinedCount}`,
        inline: false
      },
      {
        name: "🚨 Status do Sistema",
        value: stats.isRaidDetected ? "🔴 **RAID DETECTADO**" : "🟢 **NORMAL**",
        inline: true
      },
      {
        name: "⚙️ Configurações",
        value: "**Limite:** 5 membros/5min\n**Quarentena:** 10 minutos\n**Auto-ativação:** Ativada",
        inline: true
      }
    )
    .setFooter({
      text: `Solicitado por ${interaction.user.displayName}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleLiberarCommand(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser("usuario", true);
  const guild = interaction.guild!;

  try {
    const member = await guild.members.fetch(targetUser.id);
    
    if (!isInQuarantine(member.id)) {
      await interaction.reply({
        content: `❌ O usuário ${targetUser.tag} não está em quarentena.`,
        ephemeral: true,
      });
      return;
    }

    const success = await removeFromQuarantine(member);

    if (success) {
      // Log da ação manual
      await logAntiRaidAction(guild, {
        type: "MANUAL_ACTION",
        member: targetUser,
        reason: "Liberação manual da quarentena",
        details: `Liberado por: ${interaction.user.tag}`
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Quarentena Removida")
        .setColor(0x00FF00)
        .setDescription(`O usuário ${targetUser.tag} foi removido da quarentena com sucesso.`)
        .addFields({
          name: "👤 Usuário Liberado",
          value: `**Nome:** ${targetUser.displayName}\n**ID:** ${targetUser.id}`,
          inline: false
        })
        .setFooter({
          text: `Liberado por ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: `❌ Não foi possível remover ${targetUser.tag} da quarentena. Verifique se o usuário ainda está no servidor.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Erro ao liberar usuário:", error);
    await interaction.reply({
      content: `❌ Erro ao buscar o usuário ${targetUser.tag}. Verifique se ele ainda está no servidor.`,
      ephemeral: true,
    });
  }
}

async function handleVerificarCommand(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser("usuario", true);
  const guild = interaction.guild!;

  try {
    const member = await guild.members.fetch(targetUser.id);
    const inQuarantine = isInQuarantine(member.id);
    
    // Verificar se tem o cargo de quarentena
    const quarantineRole = guild.roles.cache.find(role => role.name === "🔒 Quarentena");
    const hasQuarantineRole = quarantineRole ? member.roles.cache.has(quarantineRole.id) : false;

    const embed = new EmbedBuilder()
      .setTitle("🔍 Verificação de Quarentena")
      .setColor(inQuarantine ? 0xFFA500 : 0x00FF00)
      .addFields(
        {
          name: "👤 Usuário",
          value: `**Nome:** ${targetUser.displayName}\n**Tag:** ${targetUser.tag}\n**ID:** ${targetUser.id}`,
          inline: false
        },
        {
          name: "🔒 Status da Quarentena",
          value: inQuarantine ? "🔴 **EM QUARENTENA**" : "🟢 **LIVRE**",
          inline: true
        },
        {
          name: "🎭 Cargo de Quarentena",
          value: hasQuarantineRole ? "✅ Possui" : "❌ Não possui",
          inline: true
        }
      )
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `Verificado por ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    await interaction.reply({
      content: `❌ Erro ao buscar o usuário ${targetUser.tag}. Verifique se ele ainda está no servidor.`,
      ephemeral: true,
    });
  }
}