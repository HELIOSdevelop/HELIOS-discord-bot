const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor(level = 'info') {
    this.level = levels[level] ?? levels.info;
  }

  shouldLog(level) {
    return (levels[level] ?? levels.info) <= this.level;
  }

  write(level, message, meta) {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
    console[level === 'debug' ? 'log' : level](`[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`);
  }

  error(message, meta) {
    this.write('error', message, meta);
  }

  warn(message, meta) {
    this.write('warn', message, meta);
  }

  info(message, meta) {
    this.write('info', message, meta);
  }

  debug(message, meta) {
    this.write('debug', message, meta);
  }
}

module.exports = { Logger };
