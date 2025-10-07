import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder
} from 'discord.js';
import { EmbedUtils } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Limpa mensagens do canal (apenas administradores)')
  .addIntegerOption(option =>
    option.setName('quantidade')
      .setDescription('Número de mensagens para deletar (1-100)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ Este comando só pode ser usado em servidores.',
        ephemeral: true
      });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
      await interaction.reply({
        content: '❌ Este comando só pode ser usado em canais de texto.',
        ephemeral: true
      });
      return;
    }

    const quantidade = interaction.options.get('quantidade')?.value as number || 10;

    // Criar embed de confirmação
    const confirmEmbed = new EmbedBuilder()
      .setTitle("🗑️ Confirmação de Limpeza")
      .setDescription(`Tem certeza que deseja deletar **${quantidade}** mensagens?\n\n⚠️ Esta ação não pode ser desfeita!`)
      .setColor(0xffa500)
      .setTimestamp();

    // Criar botões de confirmação
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_clear')
      .setLabel('✅ Confirmar')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_clear')
      .setLabel('❌ Cancelar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(confirmButton, cancelButton);

    await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true
    });

    // Aguardar resposta do usuário
    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 30000 // 30 segundos
    });

    collector?.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'confirm_clear') {
        try {
          // Buscar mensagens para deletar
          const messages = await channel.messages.fetch({ limit: quantidade });
          
          // Filtrar mensagens que podem ser deletadas (menos de 14 dias)
          const deletableMessages = messages.filter(msg => {
            const messageAge = Date.now() - msg.createdTimestamp;
            return messageAge < 14 * 24 * 60 * 60 * 1000; // 14 dias em ms
          });

          if (deletableMessages.size === 0) {
            await buttonInteraction.update({
              embeds: [EmbedUtils.createErrorEmbed('❌ Não há mensagens que possam ser deletadas. Mensagens com mais de 14 dias não podem ser removidas pelo Discord.')],
              components: []
            });
            return;
          }

          // Deletar mensagens
          if (deletableMessages.size === 1) {
            await deletableMessages.first()?.delete();
          } else {
            await channel.bulkDelete(deletableMessages, true);
          }

          await buttonInteraction.update({
            embeds: [EmbedUtils.createSuccessEmbed(`✅ **${deletableMessages.size}** mensagens foram deletadas com sucesso!`)],
            components: []
          });

        } catch (error) {
          await buttonInteraction.update({
            embeds: [EmbedUtils.createErrorEmbed(`❌ Erro: ${error}`)],
            components: [],
          });
        }
      } else if (buttonInteraction.customId === 'cancel_clear') {
        await buttonInteraction.update({
          embeds: [EmbedUtils.createErrorEmbed('❌ Operação cancelada pelo usuário.')],
          components: []
        });
      }
    });

    collector?.on('end', async (collected) => {
      if (collected.size === 0) {
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle("⏰ Tempo Esgotado")
            .setDescription("Tempo limite excedido. A operação foi cancelada.")
            .setColor(0xff0000)
            .setTimestamp();

          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: []
          });
        } catch (error) {
          // Silencioso se a interação já expirou
        }
      }
    });

  } catch (error) {
    console.error('Erro no comando clear:', error);
    
    const errorEmbed = EmbedUtils.createErrorEmbed('❌ Ocorreu um erro interno ao processar o comando.');

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}