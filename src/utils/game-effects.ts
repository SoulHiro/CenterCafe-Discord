import { EmbedBuilder } from "discord.js";

export class GameEffects {
  /**
   * Cria um embed animado para vitória
   */
  static createVictoryEmbed(winner: string, gameMode: 'pve' | 'pvp'): EmbedBuilder {
    const isBot = winner === 'Bot';
    const isTie = winner === 'Empate';
    
    let title: string;
    let description: string;
    let color: number;
    let emoji: string;
    
    if (isTie) {
      title = "🤝 Empate!";
      description = "Que partida equilibrada! Ninguém conseguiu vencer desta vez.";
      color = 0xffd700;
      emoji = "🤝";
    } else if (isBot) {
      title = "🤖 Bot Venceu!";
      description = "O bot foi mais esperto desta vez! Que tal tentar novamente?";
      color = 0x4ecdc4;
      emoji = "🤖";
    } else {
      title = `🎉 ${winner} Venceu!`;
      description = gameMode === 'pve' 
        ? "Parabéns! Você derrotou o bot! 🏆"
        : "Excelente jogada! Você foi o mais esperto! 🏆";
      color = 0xff6b6b;
      emoji = "🏆";
    }
    
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(`${emoji} ${description}\n\n🎮 Use o botão "🔄 Novo Jogo" para jogar novamente!`)
      .setColor(color)
      .setTimestamp();
  }
  
  /**
   * Gera mensagens motivacionais baseadas no progresso do jogo
   */
  static getMotivationalMessage(moveCount: number, gameMode: 'pve' | 'pvp'): string {
    const messages = {
      pve: [
        "🎯 Boa jogada! O bot está pensando...",
        "🤔 Interessante estratégia! Vamos ver o que o bot fará...",
        "⚡ Movimento rápido! O bot está calculando a resposta...",
        "🎪 O jogo está ficando emocionante!",
        "🔥 Que tensão! Quem será o vencedor?",
      ],
      pvp: [
        "👥 Ótima jogada! Vez do próximo jogador!",
        "🎯 Movimento estratégico! Como o oponente responderá?",
        "⚡ Rápido e certeiro! A partida está esquentando!",
        "🎪 Que duelo emocionante entre vocês dois!",
        "🔥 A tensão está no ar! Quem levará a melhor?",
      ]
    };
    
    const modeMessages = messages[gameMode];
    const index = Math.min(moveCount - 1, modeMessages.length - 1);
    return modeMessages[index] || modeMessages[modeMessages.length - 1];
  }
  
  /**
   * Cria dicas estratégicas baseadas no estado do tabuleiro
   */
  static getStrategicHint(board: (string | null)[], currentPlayer: string): string {
    const hints = [
      "💡 Dica: Tente controlar o centro do tabuleiro!",
      "🎯 Dica: Bloqueie as jogadas do oponente!",
      "⚡ Dica: Procure por oportunidades de vitória!",
      "🧠 Dica: Os cantos são posições estratégicas!",
      "🎪 Dica: Crie múltiplas ameaças simultaneamente!",
    ];
    
    // Verificar se há jogada de vitória disponível
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = currentPlayer;
        if (checkWinningMove(testBoard, currentPlayer)) {
          return "🏆 Dica: Você pode vencer nesta jogada!";
        }
      }
    }
    
    // Verificar se precisa bloquear
    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = opponent;
        if (checkWinningMove(testBoard, opponent)) {
          return "🛡️ Dica: Cuidado! Bloqueie a jogada do oponente!";
        }
      }
    }
    
    return hints[Math.floor(Math.random() * hints.length)];
  }
  
  /**
   * Cria estatísticas detalhadas do jogo
   */
  static createGameStats(scores: { X: number; O: number; draws: number }, gameMode: 'pve' | 'pvp'): string {
    const total = scores.X + scores.O + scores.draws;
    
    if (total === 0) {
      return "📊 **Estatísticas:** Primeira partida! Boa sorte! 🍀";
    }
    
    const xWinRate = total > 0 ? Math.round((scores.X / total) * 100) : 0;
    const oWinRate = total > 0 ? Math.round((scores.O / total) * 100) : 0;
    const drawRate = total > 0 ? Math.round((scores.draws / total) * 100) : 0;
    
    let stats = `📊 **Estatísticas da Sessão:**\n`;
    stats += `🎮 Total de jogos: ${total}\n`;
    stats += `🔥 X: ${scores.X} vitórias (${xWinRate}%)\n`;
    stats += `❄️ O: ${scores.O} vitórias (${oWinRate}%)\n`;
    stats += `🤝 Empates: ${scores.draws} (${drawRate}%)\n`;
    
    if (gameMode === 'pve') {
      if (scores.X > scores.O) {
        stats += `\n🏆 Você está dominando o bot!`;
      } else if (scores.O > scores.X) {
        stats += `\n🤖 O bot está levando vantagem!`;
      } else {
        stats += `\n⚖️ Partida equilibrada!`;
      }
    }
    
    return stats;
  }
  
  /**
   * Gera emojis animados para o tabuleiro
   */
  static getBoardEmoji(position: number, value: string | null, isWinningPosition: boolean = false): string {
    if (value === 'X') {
      return isWinningPosition ? '🔥' : '❌';
    } else if (value === 'O') {
      return isWinningPosition ? '💎' : '⭕';
    } else {
      // Números com emojis para posições vazias
      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
      return numberEmojis[position] || (position + 1).toString();
    }
  }
  
  /**
   * Cria uma representação visual ASCII do tabuleiro
   */
  static createASCIIBoard(board: (string | null)[]): string {
    const symbols = board.map((cell, index) => {
      if (cell === 'X') return '❌';
      if (cell === 'O') return '⭕';
      return `${index + 1}️⃣`;
    });
    
    return `
╔═══╦═══╦═══╗
║ ${symbols[0]} ║ ${symbols[1]} ║ ${symbols[2]} ║
╠═══╬═══╬═══╣
║ ${symbols[3]} ║ ${symbols[4]} ║ ${symbols[5]} ║
╠═══╬═══╬═══╣
║ ${symbols[6]} ║ ${symbols[7]} ║ ${symbols[8]} ║
╚═══╩═══╩═══╝
    `.trim();
  }
}

/**
 * Função auxiliar para verificar jogada vencedora
 */
function checkWinningMove(board: (string | null)[], player: string): boolean {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticais
    [0, 4, 8], [2, 4, 6] // Diagonais
  ];
  
  return winningLines.some(line => {
    const [a, b, c] = line;
    return board[a] === player && board[b] === player && board[c] === player;
  });
}