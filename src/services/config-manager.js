const { guildConfig: guildConfigDefaults } = require('../constants/defaults');

class ConfigManager {
  constructor(repository, envDefaults) {
    this.repository = repository;
    this.envDefaults = envDefaults;
  }

  withDefaults(config = {}) {
    return {
      ...guildConfigDefaults,
      welcomeEnabled: this.envDefaults.welcomeEnabled,
      levelingEnabled: this.envDefaults.levelingEnabled,
      activityTrackingEnabled: this.envDefaults.levelingEnabled,
      ...config
    };
  }

  async get(guildId) {
    const config = await this.repository.get(guildId, {});
    return this.withDefaults(config);
  }

  async getAll() {
    const collection = await this.repository.all();
    return Object.fromEntries(
      Object.entries(collection).map(([guildId, config]) => [guildId, this.withDefaults(config)])
    );
  }

  async update(guildId, patch) {
    const current = await this.get(guildId);
    const next = {
      ...current,
      ...patch
    };

    await this.repository.set(guildId, next);
    return next;
  }
}

module.exports = { ConfigManager };
