import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedUtils } from "../utils/embeds";

export const data = new SlashCommandBuilder()
  .setName("welcome-preview")
  .setDescription("Visualiza o embed de boas-vindas")
  .addUserOption((option) =>
    option
      .setName("usuario")
      .setDescription("Usuário para mencionar no teste")
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  try {
    if (!interaction.guild) {
      const errorEmbed = EmbedUtils.createErrorEmbed(
        "Este comando só pode ser usado em servidores!"
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    // @ts-ignore
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const memberCount = interaction.guild.memberCount;
    const embed = EmbedUtils.createWelcomeEmbed(target.username, memberCount);

    await interaction.reply({
      content: `<@${target.id}>`,
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    const errorEmbed = EmbedUtils.createErrorEmbed(
      "Ocorreu um erro ao gerar a visualização."
    );
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}
