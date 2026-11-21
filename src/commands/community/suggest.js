const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a community suggestion through a modal.'),
  async execute() {
    return null;
  }
};
