const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client, context) {
    context.logger.info(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: context.env.presenceText, type: ActivityType.Watching }],
      status: 'online'
    });

    context.jobs.fivemPoller.start();
  }
};
