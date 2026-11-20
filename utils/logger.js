const path = require('path');
const fs = require('fs');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const DEFAULT_LEVEL = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

const LOG_DIR = path.join(process.cwd(), 'logs');
const ensureLogDir = () => {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (_) {}
};

function format(level, tag, message, meta) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
  const base = `[${ts}] [${level.padEnd(5)}] [${tag}] ${message}`;
  if (meta === undefined) return base;
  try {
    return `${base} | ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  } catch (_) {
    return base;
  }
}

class Logger {
  constructor(tag = 'app', options = {}) {
    this.tag = tag;
    this.level = options.level ?? DEFAULT_LEVEL;
    this.file = options.file ?? null;
    if (this.file) ensureLogDir();
  }

  child(tag) {
    return new Logger(`${this.tag}:${tag}`, { level: this.level, file: this.file });
  }

  _write(levelName, priority, message, meta) {
    if (priority < this.level) return;
    const line = format(levelName, this.tag, message, meta);
    const stream = priority >= LOG_LEVELS.WARN ? process.stderr : process.stdout;
    stream.write(line + '\n');
    if (this.file) {
      try {
        fs.appendFileSync(path.join(LOG_DIR, this.file), line + '\n');
      } catch (_) {}
    }
  }

  debug(msg, meta) { this._write('DEBUG', LOG_LEVELS.DEBUG, msg, meta); }
  info(msg, meta)  { this._write('INFO',  LOG_LEVELS.INFO,  msg, meta); }
  warn(msg, meta)  { this._write('WARN',  LOG_LEVELS.WARN,  msg, meta); }
  error(msg, meta) { this._write('ERROR', LOG_LEVELS.ERROR, msg, meta); }
}

module.exports = {
  Logger,
  LOG_LEVELS,
  defaultLogger: new Logger('app'),
};
