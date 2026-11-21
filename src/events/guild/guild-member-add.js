const { baseEmbed } = require('../../utils/builders');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, context) {
    const config = await context.services.configManager.get(member.guild.id);
    if (!config.welcomeEnabled || !config.welcomeChannelId) {
      return;
    }

    const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (!channel) {
      return;
    }

    await channel.send({
      embeds: [
        baseEmbed({
          title: 'Welcome',
          description: `Welcome to the community, ${member}. We’re glad to have you here.`
        })
      ]
    });
  }
};
