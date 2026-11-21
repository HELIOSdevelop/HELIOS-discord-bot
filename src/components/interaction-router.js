const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/builders');
const { requireStaff } = require('../utils/permissions');

async function handleRoleSelect(interaction) {
  const [, , rolesCsv] = interaction.customId.split(':');
  const allowedRoleIds = rolesCsv.split(',');
  const selected = new Set(interaction.values);
  const member = interaction.member;
  const changes = [];

  for (const roleId of allowedRoleIds) {
    if (selected.has(roleId) && !member.roles.cache.has(roleId)) {
      await member.roles.add(roleId);
      changes.push(`Added <@&${roleId}>`);
    } else if (!selected.has(roleId) && member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      changes.push(`Removed <@&${roleId}>`);
    }
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [successEmbed(changes.length ? changes.join('\n') : 'Your roles already matched your selection.', 'Roles Updated')]
  });
}

const TICKET_MODAL_CONFIG = {
  support: {
    title: 'Support Request',
    fields: [
      { id: 'ticket_subject', label: 'What do you need help with?', style: TextInputStyle.Short, required: true, maxLength: 200 },
      { id: 'ticket_description', label: 'Describe your issue', style: TextInputStyle.Paragraph, required: true, maxLength: 1500 }
    ]
  },
  report: {
    title: 'Report Player',
    fields: [
      { id: 'reported_player', label: 'Which player do you want to report?', style: TextInputStyle.Short, required: true, maxLength: 200 },
      { id: 'report_reason', label: 'Reason for the report', style: TextInputStyle.Paragraph, required: true, maxLength: 1500 }
    ]
  },
  donation: {
    title: 'Donation (no refund possible)',
    fields: [
      { id: 'donation_amount', label: 'Donation amount', style: TextInputStyle.Short, required: true, maxLength: 100, placeholder: 'No refund possible' },
      { id: 'transaction_id', label: 'Transaction ID', style: TextInputStyle.Short, required: true, maxLength: 200, placeholder: 'No refund possible' }
    ]
  },
  question: {
    title: 'General Question',
    fields: [
      { id: 'question_content', label: 'Your question', style: TextInputStyle.Paragraph, required: true, maxLength: 1500 }
    ]
  }
};

function buildTicketModal(type) {
  const cfg = TICKET_MODAL_CONFIG[type];
  if (!cfg) return null;

  const modal = new ModalBuilder()
    .setCustomId(`tickets:modal:${type}`)
    .setTitle(cfg.title);

  for (const field of cfg.fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style)
      .setRequired(field.required)
      .setMaxLength(field.maxLength || 1000);

    if (field.placeholder) {
      input.setPlaceholder(field.placeholder);
    }

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );
  }

  return modal;
}

function isTicketTypeStaff(member, config, type) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const typeRoles = config.ticketTypeRoles?.[type];
  if (typeRoles && typeRoles.length > 0) {
    return typeRoles.some((roleId) => member.roles.cache.has(roleId));
  }

  return (config.staffRoleIds || []).some((roleId) => member.roles.cache.has(roleId));
}

async function handleTicketCreateButton(interaction, services) {
  const parts = interaction.customId.split(':');
  const type = parts[2] || 'support';

  const modal = buildTicketModal(type);
  if (!modal) {
    await interaction.reply({ ephemeral: true, content: 'Invalid ticket type.' });
    return;
  }

  await interaction.showModal(modal);
}

async function handleTicketModalSubmit(interaction, services) {
  const [, , type] = interaction.customId.split(':');
  const config = await services.configManager.get(interaction.guildId);

  const fieldConfigs = TICKET_MODAL_CONFIG[type]?.fields || [];
  const modalData = {};
  for (const field of fieldConfigs) {
    modalData[field.label] = interaction.fields.getTextInputValue(field.id);
  }

  const result = await services.ticketService.createTicket(interaction, config, type, modalData);

  if (result.existing) {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed(`You already have an open ticket: <#${result.existing.channelId}>`)]
    });
    return;
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [successEmbed(`Your ticket has been created: <#${result.channel.id}>`, 'Ticket Created')]
  });
}

async function handleTicketClose(interaction, services) {
  const [, , ticketId] = interaction.customId.split(':');
  const config = await services.configManager.get(interaction.guildId);

  const ticketRecord = await services.ticketService.repository.get(ticketId);
  const ticketType = ticketRecord?.type || 'support';

  if (!isTicketTypeStaff(interaction.member, config, ticketType)) {
    await interaction.reply({ ephemeral: true, content: 'Only staff can close tickets.' });
    return;
  }

  const closed = await services.ticketService.closeTicket(ticketId);
  if (!closed) {
    await interaction.reply({ ephemeral: true, content: 'That ticket could not be found.' });
    return;
  }

  await interaction.reply({
    embeds: [baseEmbed({ title: 'Ticket Closed', description: 'This ticket is being closed and archived.' })]
  });

  setTimeout(() => {
    interaction.channel.delete('Ticket closed').catch(() => null);
  }, 3000);
}

async function handleSuggestionAction(interaction, services) {
  const [, action, suggestionId] = interaction.customId.split(':');
  const config = await services.configManager.get(interaction.guildId);
  if (!(await requireStaff(interaction, config))) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: 'Only staff can manage suggestion states.' });
    }
    return;
  }

  const stateMap = {
    approve: 'approved',
    deny: 'denied',
    stage: 'staged'
  };

  const nextState = stateMap[action];
  const record = await services.suggestionService.updateState(suggestionId, nextState, interaction.user.id);
  if (!record) {
    await interaction.editReply({ content: 'That suggestion no longer exists.' });
    return;
  }

  const embed = baseEmbed({
    title: 'Suggestion Updated',
    description: record.content
  })
    .addFields(
      { name: 'Author', value: `<@${record.authorId}>`, inline: true },
      { name: 'State', value: nextState, inline: true },
      { name: 'Updated By', value: `<@${interaction.user.id}>`, inline: true }
    )
    .setFooter({ text: `Suggestion ID: ${record.id}` });

  await interaction.message.edit({ embeds: [embed], components: interaction.message.components });
  await interaction.editReply({ content: `Suggestion marked as ${nextState}.` });
}

async function handleSuggestModal(interaction, services) {
  const config = await services.configManager.get(interaction.guildId);
  if (!config.suggestionChannelId) {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('No suggestion channel is configured yet.')]
    });
    return;
  }

  const channel = await interaction.guild.channels.fetch(config.suggestionChannelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('The configured suggestion channel is missing or not a text channel.')]
    });
    return;
  }

  const content = interaction.fields.getTextInputValue('suggestion_content');
  await services.suggestionService.create(interaction, channel, content);
  await interaction.reply({
    ephemeral: true,
    embeds: [successEmbed(`Your suggestion was submitted in <#${channel.id}>.`, 'Suggestion Submitted')]
  });
}

function buildSuggestionModal() {
  return new ModalBuilder()
    .setCustomId('suggestions:modal')
    .setTitle('Submit a Suggestion')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('suggestion_content')
          .setLabel('What should the community or server improve?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );
}

async function routeInteraction(interaction, services) {
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('roles:select:')) {
    await handleRoleSelect(interaction);
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'tickets:create' || interaction.customId.startsWith('tickets:create:')) {
      await handleTicketCreateButton(interaction, services);
      return;
    }

    if (interaction.customId.startsWith('tickets:close:')) {
      await handleTicketClose(interaction, services);
      return;
    }

    if (interaction.customId.startsWith('suggestions:')) {
      await interaction.deferReply({ ephemeral: true });
      await handleSuggestionAction(interaction, services);
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'suggestions:modal') {
      await handleSuggestModal(interaction, services);
      return;
    }

    if (interaction.customId.startsWith('tickets:modal:')) {
      await handleTicketModalSubmit(interaction, services);
      return;
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'suggest') {
    await interaction.showModal(buildSuggestionModal());
  }
}

module.exports = { routeInteraction };
