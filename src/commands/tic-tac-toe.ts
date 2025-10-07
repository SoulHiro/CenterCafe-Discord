import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  ButtonInteraction,
} from "discord.js";
import { EmbedUtils } from "../utils/embeds.js";
import { GameEffects } from "../utils/game-effects.js";

// Tipos para o jogo
type Player = 'X' | 'O' | null;
type GameMode = 'pvp' | 'pve';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameState {
  board: Player[];
  currentPlayer: Player;
  gameMode: GameMode;
  difficulty?: Difficulty;
  player1Id: string;
  player2Id?: string;
  scores: { X: number; O: number; draws: number };
  gameActive: boolean;
  inviteStatus?: 'pending' | 'accepted' | 'declined';
  invitedPlayerId?: string;
}

// Armazenamento temporário dos jogos (em memória)
const activeGames = new Map<string, GameState>();

export const data = new SlashCommandBuilder()
  .setName("jogo-da-velha")
  .setDescription("Inicie um jogo da velha!")
  .addStringOption(option =>
    option
      .setName("modo")
      .setDescription("Escolha o modo de jogo")
      .setRequired(true)
      .addChoices(
        { name: "🤖 Contra o Bot", value: "pve" },
        { name: "👥 Contra outro jogador", value: "pvp" }
      )
  )
  .addUserOption(option =>
    option
      .setName("oponente")
      .setDescription("Mencione o jogador que você quer desafiar (apenas para modo PvP)")
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName("dificuldade")
      .setDescription("Dificuldade do bot (apenas para modo contra bot)")
      .setRequired(false)
      .addChoices(
        { name: "😴 Fácil", value: "easy" },
        { name: "🤔 Médio", value: "medium" },
        { name: "🧠 Difícil", value: "hard" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const mode = interaction.options.getString("modo", true) as GameMode;
    const difficulty = interaction.options.getString("dificuldade") as Difficulty || "medium";
    const opponent = interaction.options.getUser("oponente");
    
    // Validações
    if (mode === 'pvp' && opponent && opponent.id === interaction.user.id) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Você não pode jogar contra si mesmo!")],
        ephemeral: true
      });
      return;
    }
    
    if (mode === 'pvp' && opponent && opponent.bot) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Você não pode convidar um bot para jogar!")],
        ephemeral: true
      });
      return;
    }
    
    // Criar novo jogo
    const gameId = `${interaction.user.id}-${Date.now()}`;
    const gameState: GameState = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      gameMode: mode,
      difficulty: mode === 'pve' ? difficulty : undefined,
      player1Id: interaction.user.id,
      player2Id: mode === 'pve' ? 'bot' : undefined,
      scores: { X: 0, O: 0, draws: 0 },
      gameActive: mode === 'pve' || !opponent, // Ativo imediatamente se PvE ou PvP sem oponente específico
      inviteStatus: mode === 'pvp' && opponent ? 'pending' : undefined,
      invitedPlayerId: opponent?.id
    };
    
    activeGames.set(gameId, gameState);
    
    // Se for PvP com oponente específico, criar convite
    if (mode === 'pvp' && opponent) {
      const inviteEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎮 Convite para Jogo da Velha!')
        .setDescription(`**${interaction.user.username}** te desafiou para um jogo da velha!`)
        .addFields(
          { name: '🎯 Desafiante', value: `<@${interaction.user.id}>`, inline: true },
          { name: '🎲 Modo', value: '👥 PvP', inline: true },
          { name: '⏰ Status', value: '⏳ Aguardando resposta...', inline: true }
        )
        .setFooter({ text: `ID do Jogo: ${gameId}` })
        .setTimestamp();

      const inviteButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ttt_accept_${gameId}`)
            .setLabel('✅ Aceitar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`ttt_decline_${gameId}`)
            .setLabel('❌ Recusar')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({
        content: `<@${opponent.id}>`,
        embeds: [inviteEmbed],
        components: [inviteButtons]
      });
      return;
    }
    
    // Jogo normal (PvE ou PvP sem oponente específico)
    const embed = createGameEmbed(gameState, interaction.user.username);
    const components = createGameBoard(gameId, gameState);
    
    await interaction.reply({
      embeds: [embed],
      components: components
    });
    
    // Se for contra bot e bot começar (50% chance), fazer jogada do bot
    if (mode === 'pve' && Math.random() < 0.5) {
      gameState.currentPlayer = 'O';
      setTimeout(() => makeBotMove(interaction, gameId), 1000);
    }
    
  } catch (error) {
    console.error('Erro no jogo da velha:', error);
    
    // Verificar se a interação já foi respondida
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`❌ Erro ao iniciar o jogo: ${error}`)],
        ephemeral: true
      });
    }
  }
}

function createGameEmbed(gameState: GameState, playerName: string, player2Name?: string): EmbedBuilder {
  const { currentPlayer, gameMode, difficulty, scores, board, gameActive } = gameState;
  
  let description = `🎮 **Jogo da Velha**\n\n`;
  
  // Adicionar tabuleiro ASCII visual
  description += `${GameEffects.createASCIIBoard(board)}\n\n`;
  
  if (gameMode === 'pve') {
    description += `👤 **Jogador:** ${playerName} (X)\n`;
    description += `🤖 **Bot:** Nível ${getDifficultyName(difficulty!)} (O)\n\n`;
  } else {
    description += `👥 **Modo:** Jogador vs Jogador\n`;
    description += `👤 **Jogador X:** ${playerName}\n`;
    
    if (gameState.player2Id && gameState.player2Id !== 'bot') {
      description += `👤 **Jogador O:** ${player2Name || 'Jogador 2'}\n\n`;
    } else {
      description += `👤 **Jogador O:** Aguardando jogador...\n\n`;
    }
  }
  
  if (gameActive) {
    let currentPlayerName = '';
    if (currentPlayer === 'X') {
      currentPlayerName = playerName;
    } else if (gameMode === 'pve') {
      currentPlayerName = 'Bot';
    } else if (player2Name) {
      currentPlayerName = player2Name;
    } else {
      currentPlayerName = 'Jogador O';
    }
    
    description += `🎯 **Vez de:** ${currentPlayerName} (${currentPlayer === 'X' ? 'X ❌' : 'O ⭕'})\n\n`;
    
    // Adicionar dica estratégica
    const hint = GameEffects.getStrategicHint(board, currentPlayer || 'X');
    description += `${hint}\n\n`;
  }
  
  // Estatísticas detalhadas
  description += GameEffects.createGameStats(scores, gameMode);
  
  if (gameActive) {
    description += `\n\n💡 **Como jogar:** Clique nos botões numerados para fazer sua jogada!`;
  }
  
  return new EmbedBuilder()
    .setTitle("🎯 Jogo da Velha - Center Café")
    .setDescription(description)
    .setColor(gameActive ? (currentPlayer === 'X' ? 0xff6b6b : 0x4ecdc4) : 0xffd700)
    .setTimestamp()
    .setFooter({ 
      text: `Desenvolvido com ❤️ para o Center Café • ${gameActive ? 'Jogo em andamento' : 'Jogo finalizado'}` 
    });
}

function createGameBoard(gameId: string, gameState: GameState): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  
  // Criar 3 linhas de 3 botões cada
  for (let row = 0; row < 3; row++) {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cellValue = gameState.board[index];
      
      const button = new ButtonBuilder()
        .setCustomId(`ttt_${gameId}_${index}`)
        .setStyle(cellValue ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setLabel(cellValue || (index + 1).toString())
        .setDisabled(!!cellValue || !gameState.gameActive);
      
      // Cores diferentes para X e O
      if (cellValue === 'X') {
        button.setStyle(ButtonStyle.Danger);
      } else if (cellValue === 'O') {
        button.setStyle(ButtonStyle.Success);
      }
      
      actionRow.addComponents(button);
    }
    
    rows.push(actionRow);
  }
  
  // Adicionar botões de controle
  const controlRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`ttt_${gameId}_reset`)
        .setLabel("🔄 Novo Jogo")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ttt_${gameId}_quit`)
        .setLabel("❌ Sair")
        .setStyle(ButtonStyle.Danger)
    );
  
  rows.push(controlRow);
  
  return rows;
}

function getDifficultyName(difficulty: Difficulty): string {
  const names = {
    easy: "Fácil 😴",
    medium: "Médio 🤔", 
    hard: "Difícil 🧠"
  };
  return names[difficulty];
}

function checkWinner(board: Player[]): { winner: Player | 'draw' | null, line?: number[] } {
  // Linhas vencedoras possíveis
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticais
    [0, 4, 8], [2, 4, 6] // Diagonais
  ];
  
  // Verificar vitória
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  
  // Verificar empate
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw' };
  }
  
  return { winner: null };
}

function makeBotMove(interaction: ChatInputCommandInteraction | ButtonInteraction, gameId: string) {
  const gameState = activeGames.get(gameId);
  if (!gameState || !gameState.gameActive || gameState.currentPlayer !== 'O') return;
  
  let move: number;
  
  switch (gameState.difficulty) {
    case 'easy':
      move = makeRandomMove(gameState.board);
      break;
    case 'medium':
      move = makeMediumMove(gameState.board);
      break;
    case 'hard':
      move = makeHardMove(gameState.board);
      break;
    default:
      move = makeRandomMove(gameState.board);
  }
  
  if (move !== -1) {
    gameState.board[move] = 'O';
    gameState.currentPlayer = 'X';
    
    const result = checkWinner(gameState.board);
    if (result.winner) {
      handleGameEnd(gameState, result);
    }
    
    updateGameDisplay(interaction, gameId);
  }
}

function makeRandomMove(board: Player[]): number {
  const availableMoves = board
    .map((cell, index) => cell === null ? index : -1)
    .filter(index => index !== -1);
  
  return availableMoves.length > 0 
    ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
    : -1;
}

function makeMediumMove(board: Player[]): number {
  // 70% chance de fazer jogada inteligente, 30% aleatória
  if (Math.random() < 0.7) {
    return makeHardMove(board);
  }
  return makeRandomMove(board);
}

function makeHardMove(board: Player[]): number {
  // Implementação do algoritmo Minimax simplificado
  
  // 1. Tentar vencer
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      if (checkWinner(board).winner === 'O') {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  
  // 2. Bloquear vitória do oponente
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'X';
      if (checkWinner(board).winner === 'X') {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  
  // 3. Jogar no centro se disponível
  if (board[4] === null) {
    return 4;
  }
  
  // 4. Jogar nos cantos
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => board[i] === null);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }
  
  // 5. Jogada aleatória
  return makeRandomMove(board);
}

function handleGameEnd(gameState: GameState, result: { winner: Player | 'draw', line?: number[] }) {
  gameState.gameActive = false;
  
  if (result.winner === 'X') {
    gameState.scores.X++;
  } else if (result.winner === 'O') {
    gameState.scores.O++;
  } else {
    gameState.scores.draws++;
  }
}

// Função auxiliar para obter nome do usuário
async function getUserName(interaction: ChatInputCommandInteraction | ButtonInteraction, userId: string): Promise<string> {
  try {
    if (userId === 'bot') return 'Bot';
    const user = await interaction.client.users.fetch(userId);
    return user.username;
  } catch (error) {
    return 'Usuário Desconhecido';
  }
}

async function updateGameDisplay(interaction: ChatInputCommandInteraction | ButtonInteraction, gameId: string) {
  const gameState = activeGames.get(gameId);
  if (!gameState) return;
  
  const player1Name = await getUserName(interaction, gameState.player1Id);
  const player2Name = gameState.player2Id ? await getUserName(interaction, gameState.player2Id) : undefined;
  
  const embed = createGameEmbed(gameState, player1Name, player2Name);
  const components = createGameBoard(gameId, gameState);
  
  try {
    if (interaction instanceof ButtonInteraction) {
      await interaction.editReply({
        embeds: [embed],
        components: components
      });
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: components
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar display do jogo:', error);
  }
}

// Manipulador de interações dos botões (será registrado no main.ts)
export async function handleTicTacToeButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.customId.startsWith('ttt_')) return;
    
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const gameId = parts[2];
    
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Jogo não encontrado ou expirado!")],
        ephemeral: true
      });
      return;
    }
    
    // Tratamento de convites
    if (action === 'accept') {
      // Verificar se é o jogador convidado
      if (interaction.user.id !== gameState.invitedPlayerId) {
        await interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed("❌ Este convite não é para você!")],
          ephemeral: true
        });
        return;
      }
      
      // Aceitar convite
      gameState.inviteStatus = 'accepted';
      gameState.player2Id = interaction.user.id;
      gameState.gameActive = true;
      
      const acceptEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Convite Aceito!')
        .setDescription(`**${interaction.user.username}** aceitou o desafio! O jogo começou!`)
        .addFields(
          { name: '🎯 Jogador X', value: `<@${gameState.player1Id}>`, inline: true },
          { name: '🎯 Jogador O', value: `<@${gameState.player2Id}>`, inline: true },
          { name: '🎮 Vez de', value: `<@${gameState.player1Id}> (X)`, inline: true }
        )
        .setFooter({ text: `ID do Jogo: ${gameId}` })
        .setTimestamp();

      const gameComponents = createGameBoard(gameId, gameState);
      
      await interaction.update({
        content: null,
        embeds: [acceptEmbed],
        components: gameComponents
      });
      return;
    }
    
    if (action === 'decline') {
      // Verificar se é o jogador convidado
      if (interaction.user.id !== gameState.invitedPlayerId) {
        await interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed("❌ Este convite não é para você!")],
          ephemeral: true
        });
        return;
      }
      
      // Recusar convite
      gameState.inviteStatus = 'declined';
      activeGames.delete(gameId);
      
      const declineEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Convite Recusado')
        .setDescription(`**${interaction.user.username}** recusou o desafio.`)
        .addFields(
          { name: '🎯 Desafiante', value: `<@${gameState.player1Id}>`, inline: true },
          { name: '💭 Status', value: 'Convite recusado', inline: true }
        )
        .setTimestamp();

      await interaction.update({
        content: null,
        embeds: [declineEmbed],
        components: []
      });
      return;
    }
    
    // Verificar se o jogo está ativo (não é convite pendente)
    if (!gameState.gameActive) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Aguardando resposta ao convite!")],
        ephemeral: true
      });
      return;
    }
    
    // Verificar se é o jogador correto
    if (gameState.gameMode === 'pve' && gameState.currentPlayer === 'O') {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("⏳ Aguarde a jogada do bot!")],
        ephemeral: true
      });
      return;
    }
    
    if (gameState.gameMode === 'pvp' && gameState.player2Id && 
        gameState.currentPlayer === 'O' && interaction.user.id !== gameState.player2Id) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Não é sua vez!")],
        ephemeral: true
      });
      return;
    }
    
    if (gameState.gameMode === 'pvp' && gameState.currentPlayer === 'X' && 
        interaction.user.id !== gameState.player1Id) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Não é sua vez!")],
        ephemeral: true
      });
      return;
    }
    
    // Ações especiais
    if (action === 'reset') {
      gameState.board = Array(9).fill(null);
      gameState.currentPlayer = 'X';
      gameState.gameActive = true;
      
      const player1Name = await getUserName(interaction, gameState.player1Id);
      const player2Name = gameState.player2Id ? await getUserName(interaction, gameState.player2Id) : undefined;
      
      await interaction.update({
        embeds: [createGameEmbed(gameState, player1Name, player2Name)],
        components: createGameBoard(gameId, gameState)
      });
      return;
    }
    
    if (action === 'quit') {
      activeGames.delete(gameId);
      await interaction.update({
        embeds: [EmbedUtils.createSuccessEmbed("👋 Jogo encerrado! Obrigado por jogar!")],
        components: []
      });
      return;
    }
    
    // Jogada normal
    const position = parseInt(action);
    if (isNaN(position) || position < 0 || position > 8 || gameState.board[position]) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Jogada inválida!")],
        ephemeral: true
      });
      return;
    }
    
    // Registrar jogador 2 no modo PvP
    if (gameState.gameMode === 'pvp' && !gameState.player2Id && 
        interaction.user.id !== gameState.player1Id) {
      gameState.player2Id = interaction.user.id;
    }
    
    // Fazer jogada
    gameState.board[position] = gameState.currentPlayer;
    
    // Verificar vitória
    const result = checkWinner(gameState.board);
    if (result.winner) {
      handleGameEnd(gameState, result);
    } else {
      // Trocar jogador
      gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    }
    
    const player1Name = await getUserName(interaction, gameState.player1Id);
    const player2Name = gameState.player2Id ? await getUserName(interaction, gameState.player2Id) : undefined;
    
    await interaction.update({
      embeds: [createGameEmbed(gameState, player1Name, player2Name)],
      components: createGameBoard(gameId, gameState)
    });
    
    // Se for contra bot e for a vez do bot, fazer jogada
    if (gameState.gameMode === 'pve' && gameState.currentPlayer === 'O' && gameState.gameActive) {
      setTimeout(() => makeBotMove(interaction, gameId), 1500);
    }
    
  } catch (error) {
    console.error('Erro no manipulador de botões do jogo da velha:', error);
    
    // Verificar se a interação já foi respondida
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed("❌ Erro interno do jogo. Tente novamente!")],
        ephemeral: true
      });
    }
  }
}