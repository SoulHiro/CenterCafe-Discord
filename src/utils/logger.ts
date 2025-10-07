export class Logger {
  static info(message: string): void {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
  }

  static success(message: string): void {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }

  static warning(message: string): void {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
  }

  static error(message: string): void {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }

  static bot(message: string): void {
    console.log(`\x1b[35m[BOT]\x1b[0m ${message}`);
  }

  static startup(): void {
    console.log('\x1b[36m╔══════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║           🤖 CENTER CAFÉ BOT         ║\x1b[0m');
    console.log('\x1b[36m╚══════════════════════════════════════╝\x1b[0m');
    console.log('');
    this.success('Bot iniciado com sucesso! ☕');
    this.info('Status: Online');
    this.info('Versão: 1.0.0');
    this.info('Desenvolvido com Discord.js');
    console.log('');
  }
}