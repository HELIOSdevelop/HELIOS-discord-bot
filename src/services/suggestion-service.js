const { baseEmbed, suggestionActionComponents } = require('../utils/builders');

class SuggestionService {
  constructor(repository) {
    this.repository = repository;
  }

  createId() {
    return `sug_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  async create(interaction, channel, content) {
    const suggestionId = this.createId();
    const embed = baseEmbed({
      title: 'New Suggestion',
      description: content
    })
      .addFields(
        { name: 'Author', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'State', value: 'Pending', inline: true }
      )
      .setFooter({ text: `Suggestion ID: ${suggestionId}` });

    const message = await channel.send({
      embeds: [embed],
      components: suggestionActionComponents(suggestionId)
    });

    const record = {
      id: suggestionId,
      guildId: interaction.guildId,
      channelId: channel.id,
      messageId: message.id,
      authorId: interaction.user.id,
      content,
      state: 'pending',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await this.repository.set(suggestionId, record);
    return record;
  }

  async updateState(suggestionId, nextState, moderatorId) {
    const record = await this.repository.get(suggestionId);
    if (!record) {
      return null;
    }

    const next = {
      ...record,
      state: nextState,
      moderatorId,
      updatedAt: new Date().toISOString()
    };

    await this.repository.set(suggestionId, next);
    return next;
  }
}

module.exports = { SuggestionService };
