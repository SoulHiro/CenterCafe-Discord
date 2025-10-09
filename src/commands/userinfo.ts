import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Exibe informações detalhadas de um usuário")
  .addUserOption((option) =>
    option
      .setName("usuario")
      .setDescription(
        "Usuário para exibir informações (deixe vazio para suas próprias informações)"
      )
      .setRequired(false)
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

    const targetUser =
      interaction.options.getUser("usuario") || interaction.user;
    const member = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    if (!member) {
      await interaction.reply({
        content: "❌ Usuário não encontrado neste servidor.",
        ephemeral: true,
      });
      return;
    }

    const userStatus = member.presence?.status || "offline";

    // Obter cargos (excluindo @everyone)
    const roles = member.roles.cache
      .filter((role) => role.name !== "@everyone")
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString())
      .slice(0, 10); // Limitar a 10 cargos para não quebrar o embed

    const rolesText = roles.length > 0 ? roles.join(", ") : "Nenhum cargo";
    const moreRoles =
      member.roles.cache.size - 1 > 10
        ? `\n*... e mais ${member.roles.cache.size - 1 - 10} cargos*`
        : "";

    // Atividade atual
    const activity = member.presence?.activities?.[0];
    let activityText = "Nenhuma atividade";

    if (activity) {
      switch (activity.type) {
        case 0: // PLAYING
          activityText = `🎮 Jogando **${activity.name}**`;
          break;
        case 1: // STREAMING
          activityText = `📺 Transmitindo **${activity.name}**`;
          break;
        case 2: // LISTENING
          activityText = `🎵 Ouvindo **${activity.name}**`;
          break;
        case 3: // WATCHING
          activityText = `📺 Assistindo **${activity.name}**`;
          break;
        case 5: // COMPETING
          activityText = `🏆 Competindo em **${activity.name}**`;
          break;
        default:
          activityText = `**${activity.name}**`;
      }

      if (activity.details) {
        activityText += `\n*${activity.details}*`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`👤 Informações do Usuário`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setColor(member.displayHexColor || 0x8b4513) // Cor do cargo ou marrom café
      .addFields(
        {
          name: "🏷️ Nome Completo",
          value: `**Nome:** ${targetUser.displayName}\n**Tag:** ${targetUser.tag}`,
          inline: false,
        },
        {
          name: "🆔 ID do Usuário",
          value: targetUser.id,
          inline: false,
        },
        {
          name: "📅 Conta Criada",
          value: `<t:${Math.floor(
            targetUser.createdTimestamp / 1000
          )}:F>\n<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
          inline: false,
        },
        {
          name: "📥 Entrou no Servidor",
          value: member.joinedTimestamp
            ? `<t:${Math.floor(
                member.joinedTimestamp / 1000
              )}:F>\n<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : "Data desconhecida",
          inline: false,
        },
        {
          name: "🎭 Cargos",
          value: `**Total:** ${
            member.roles.cache.size - 1
          }\n${rolesText}${moreRoles}`,
          inline: false,
        },
        {
          name: "🎯 Atividade Atual",
          value: activityText,
          inline: false,
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    // Adicionar informações extras se for um membro com permissões especiais
    if (member.permissions.has("Administrator")) {
      embed.addFields({
        name: "⚡ Permissões Especiais",
        value: "🔧 Administrador",
        inline: true,
      });
    } else if (member.permissions.has("ManageGuild")) {
      embed.addFields({
        name: "⚡ Permissões Especiais",
        value: "🛠️ Gerenciar Servidor",
        inline: true,
      });
    } else if (member.permissions.has("ModerateMembers")) {
      embed.addFields({
        name: "⚡ Permissões Especiais",
        value: "🛡️ Moderador",
        inline: true,
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erro no comando userinfo:", error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao obter informações do usuário.",
      ephemeral: true,
    });
  }
}
