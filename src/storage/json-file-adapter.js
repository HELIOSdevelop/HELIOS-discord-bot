const fs = require('fs');
const path = require('path');

class JsonFileAdapter {
  constructor(dataDir) {
    this.dataDir = dataDir;
    fs.mkdirSync(dataDir, { recursive: true });
  }

  resolve(name) {
    return path.join(this.dataDir, `${name}.json`);
  }

  async read(name, fallback = {}) {
    const filePath = this.resolve(name);

    try {
      const raw = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fallback;
      }

      throw error;
    }
  }

  async write(name, value) {
    const filePath = this.resolve(name);
    await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  }
}

module.exports = { JsonFileAdapter };
