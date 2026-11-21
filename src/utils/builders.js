const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

function baseEmbed(options = {}) {
  return new EmbedBuilder()
    .setColor(options.color || 0x2b8a3e)
    .setTitle(options.title || 'HELIOS Community Bot')
    .setDescription(options.description || '')
    .setTimestamp();
}

function errorEmbed(message) {
  return baseEmbed({
    color: 0xcc3344,
    title: 'Something went wrong',
    description: message
  });
}

function successEmbed(message, title = 'Done') {
  return baseEmbed({
    color: 0x2f9e44,
    title,
    description: message
  });
}

function rolePanelComponents(roles) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`roles:select:${roles.map((role) => role.id).join(',')}`)
    .setPlaceholder('Choose your community roles')
    .setMinValues(0)
    .setMaxValues(roles.length)
    .addOptions(
      roles.map((role) => ({
        label: role.name,
        value: role.id,
        description: `Toggle the ${role.name} role`
      }))
    );

  return [new ActionRowBuilder().addComponents(menu)];
}

function ticketPanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tickets:create:support')
        .setLabel('🔧 Support')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('tickets:create:report')
        .setLabel('🚨 Report player')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('tickets:create:donation')
        .setLabel('💰 Donation')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('tickets:create:question')
        .setLabel('❓ General question')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function ticketCloseComponents(ticketId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tickets:close:${ticketId}`)
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function suggestionActionComponents(suggestionId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`suggestions:approve:${suggestionId}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`suggestions:stage:${suggestionId}`).setLabel('Stage').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`suggestions:deny:${suggestionId}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
    )
  ];
}

module.exports = {
  baseEmbed,
  errorEmbed,
  successEmbed,
  rolePanelComponents,
  ticketPanelComponents,
  ticketCloseComponents,
  suggestionActionComponents
};
