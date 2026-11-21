class ActivityService {
  constructor(repository, configManager) {
    this.repository = repository;
    this.configManager = configManager;
  }

  async trackMessage(message) {
    if (!message.guild || message.author.bot) {
      return;
    }

    const config = await this.configManager.get(message.guild.id);
    if (!config.activityTrackingEnabled) {
      return;
    }

    const guildId = message.guild.id;
    const userId = message.author.id;
    const all = await this.repository.get(guildId, {});
    const current = all[userId] || { xp: 0, messages: 0, lastMessageAt: null };
    const next = {
      xp: current.xp + 5,
      messages: current.messages + 1,
      lastMessageAt: new Date().toISOString()
    };

    await this.repository.set(guildId, {
      ...all,
      [userId]: next
    });
  }

  async getStats(guildId, userId) {
    const guildActivity = await this.repository.get(guildId, {});
    return guildActivity[userId] || { xp: 0, messages: 0, lastMessageAt: null };
  }
}

module.exports = { ActivityService };
