# 🤖 Center Café Bot

Bot do Discord desenvolvido para o servidor Center Café, com funcionalidades de boas-vindas, comandos slash e sistema de cargos automáticos.

## ✨ Funcionalidades

- **Sistema de Boas-vindas**: Mensagem automática com embed personalizado e GIF para novos membros
- **Atribuição Automática de Cargos**: Cargo padrão atribuído automaticamente aos novos usuários
- **Comandos Slash**: Sistema completo de comandos com atualização dinâmica
- **Logs Coloridos**: Sistema de logging detalhado e colorido no terminal
- **Estrutura Modular**: Código bem organizado em módulos para fácil manutenção

## 📁 Estrutura do Projeto

```
src/
├── commands/           # Comandos slash do bot
│   ├── deploy-commands.ts
│   ├── index.ts
│   ├── ping.ts
│   └── update-commands.ts
├── events/            # Eventos do Discord
│   ├── guild-member-add.ts
│   └── index.ts
├── utils/             # Utilitários e helpers
│   ├── embeds.ts
│   └── logger.ts
├── config.ts          # Configurações do bot
└── main.ts           # Arquivo principal
```

## 🚀 Comandos Disponíveis

- `/ping` - Verifica a latência do bot
- `/update-commands` - Atualiza todos os slash commands (Admin apenas)

## ⚙️ Configuração

1. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   DISCORD_CLIENT_ID=seu_client_id_aqui
   ```

2. IDs importantes configurados:
   - Canal de boas-vindas: `1404485327242133625`
   - Cargo automático: `1061343817812426857`
   - Canal de inicialização: `1424920316039139438`

## 🛠️ Desenvolvimento

### Instalação
```bash
pnpm install
```

### Executar
```bash
pnpm start
```

### Estrutura de Logs
O bot utiliza um sistema de logs coloridos que exibe:
- ✅ Sucessos em verde
- ℹ️ Informações em ciano
- ⚠️ Avisos em amarelo
- ❌ Erros em vermelho
- 🤖 Logs do bot em roxo

## 📝 Manutenção

- Todos os embeds são criados através da classe `EmbedUtils` em `src/utils/embeds.ts`
- Logs são gerenciados pela classe `Logger` em `src/utils/logger.ts`
- Eventos são organizados na pasta `src/events/`
- Comandos são organizados na pasta `src/commands/`

## 🎨 Personalização

Para personalizar as mensagens de boas-vindas, edite o método `createWelcomeEmbed` em `src/utils/embeds.ts`.

Para adicionar novos comandos:
1. Crie o arquivo do comando em `src/commands/`
2. Adicione a importação em `src/commands/index.ts`
3. Use `/update-commands` para registrar o novo comando

---

Desenvolvido com ❤️ para a comunidade Center Café ☕