import fs from 'fs/promises';
import path from 'path';

const VERBOSITY_LEVELS = {
  'quiet': 0,
  'info': 1,
  'debug': 2
};

export class Logger {
  constructor(config = {}) {
    this.verbosity = VERBOSITY_LEVELS[config.verbosity || 'info'] || 1;
    this.filePath = config.filePath || null;
  }

  async init() {
    if (this.filePath) {
      try {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.writeFile(this.filePath, ''); // Truncate file
      } catch (e) {
        console.error(`Failed to initialize log file: ${e.message}`);
      }
    }
  }

  async log(message, level = 'info') {
    const levelVal = VERBOSITY_LEVELS[level] || 1;
    if (levelVal > this.verbosity) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Console output
    if (level === 'debug') {
      console.debug(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // File output
    if (this.filePath) {
      try {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.appendFile(this.filePath, formattedMessage + '\n');
      } catch (e) {
        console.error(`Failed to write to log file: ${e.message}`);
      }
    }
  }

  async debug(message) {
    await this.log(message, 'debug');
  }

  async info(message) {
    await this.log(message, 'info');
  }

  async warn(message) {
    await this.log(message, 'info');
  }

  async error(message) {
    await this.log(message, 'quiet');
  }
}
