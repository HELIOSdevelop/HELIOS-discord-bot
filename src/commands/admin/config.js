const { ChannelType, SlashCommandBuilder } = require('discord.js');
const { baseEmbed, successEmbed, errorEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');

const TICKET_TYPES = [
  { name: '🔧 Support', value: 'support' },
  { name: '🚨 Report player', value: 'report' },
  { name: '💰 Donation', value: 'donation' },
  { name: '❓ General question', value: 'question' }
];

function formatTicketTypeRoles(config, type) {
  const roles = config.ticketTypeRoles?.[type];
  return roles && roles.length > 0 ? roles.map((id) => `<@&${id}>`).join(', ') : 'Falls back to global staff roles';
}

function formatTicketTypeCategory(config, type) {
  const catId = config.ticketTypeCategoryIds?.[type];
  return catId ? `<#${catId}>` : 'Falls back to global ticket category';
}

function formatConfig(config) {
  const lines = [
    `Welcome Channel: ${config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Not set'}`,
    `Log Channel: ${config.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`,
    `Status Channel: ${config.statusChannelId ? `<#${config.statusChannelId}>` : 'Not set'}`,
    `Status Voice Channel: ${config.statusVoiceChannelId ? `<#${config.statusVoiceChannelId}>` : 'Not set'}`,
    `Suggestion Channel: ${config.suggestionChannelId ? `<#${config.suggestionChannelId}>` : 'Not set'}`,
    `AI Channel: ${config.aiChannelId ? `<#${config.aiChannelId}>` : 'Not set'}`,
    `Ticket Category: ${config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : 'Not set'}`,
    `Restart Reminder Channel: ${config.restartReminderChannelId ? `<#${config.restartReminderChannelId}>` : 'Not set'}`,
    `Staff Roles: ${(config.staffRoleIds || []).length ? config.staffRoleIds.map((id) => `<@&${id}>`).join(', ') : 'Not set'}`,
    `FiveM Address: ${config.fivemServerAddress || 'Not set'}`,
    `Connect Label: ${config.fivemConnectLabel || 'Not set'}`,
    `Welcome Enabled: ${config.welcomeEnabled ? 'Yes' : 'No'}`,
    `Activity Tracking: ${config.activityTrackingEnabled ? 'Enabled' : 'Disabled'}`,
    `AI Enabled: ${config.aiEnabled ? 'Enabled' : 'Disabled'}`,
    `AI Image Review: ${config.aiImageReviewEnabled ? 'Enabled' : 'Disabled'}`
  ];

  for (const t of TICKET_TYPES) {
    const label = t.name;
    const typeRoles = formatTicketTypeRoles(config, t.value);
    const typeCat = formatTicketTypeCategory(config, t.value);
    lines.push(`${label} roles: ${typeRoles}`);
    lines.push(`${label} category: ${typeCat}`);
  }

  return lines.join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or update guild-specific bot settings.')
    .addSubcommand((subcommand) => subcommand.setName('view').setDescription('View the current guild configuration.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set-channel')
        .setDescription('Set a channel-backed config value.')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Configuration key')
            .setRequired(true)
            .addChoices(
              { name: 'welcome_channel', value: 'welcomeChannelId' },
              { name: 'log_channel', value: 'logChannelId' },
              { name: 'status_channel', value: 'statusChannelId' },
              { name: 'status_voice_channel', value: 'statusVoiceChannelId' },
              { name: 'suggestion_channel', value: 'suggestionChannelId' },
              { name: 'ai_channel', value: 'aiChannelId' },
              { name: 'ticket_category', value: 'ticketCategoryId' },
              { name: 'restart_reminder_channel', value: 'restartReminderChannelId' }
            )
        )
        .addChannelOption((option) => option.setName('channel').setDescription('Target channel').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set-role')
        .setDescription('Add or remove a staff role.')
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Add or remove the role')
            .setRequired(true)
            .addChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' })
        )
        .addRoleOption((option) => option.setName('role').setDescription('Role to manage').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set-text')
        .setDescription('Update a text config field.')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Text field to change')
            .setRequired(true)
            .addChoices(
              { name: 'fivem_address', value: 'fivemServerAddress' },
              { name: 'connect_label', value: 'fivemConnectLabel' },
              { name: 'rules_text', value: 'rulesText' },
              { name: 'faq_text', value: 'faqText' },
              { name: 'info_text', value: 'infoText' }
            )
        )
        .addStringOption((option) => option.setName('value').setDescription('New value').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle boolean config fields.')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Setting to change')
            .setRequired(true)
            .addChoices(
              { name: 'welcome_enabled', value: 'welcomeEnabled' },
              { name: 'activity_tracking', value: 'activityTrackingEnabled' },
              { name: 'ai_enabled', value: 'aiEnabled' },
              { name: 'ai_image_review', value: 'aiImageReviewEnabled' }
            )
        )
        .addBooleanOption((option) => option.setName('value').setDescription('Enabled state').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ticket-type')
        .setDescription('Configure ticket type permissions and categories.')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Ticket type')
            .setRequired(true)
            .addChoices(...TICKET_TYPES)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Action to perform')
            .setRequired(true)
            .addChoices(
              { name: 'Add staff role', value: 'add-role' },
              { name: 'Remove staff role', value: 'remove-role' },
              { name: 'Set category', value: 'set-category' },
              { name: 'View config', value: 'view' }
            )
        )
        .addRoleOption((option) => option.setName('role').setDescription('Role for add/remove actions'))
        .addChannelOption((option) => option.setName('category').setDescription('Category for set-category action').addChannelTypes(ChannelType.GuildCategory))
    ),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      await interaction.reply({
        embeds: [baseEmbed({ title: 'Guild Configuration', description: formatConfig(config) })],
        ephemeral: true
      });
      return;
    }

    if (!(await requireStaff(interaction, config))) {
      return;
    }

    if (subcommand === 'set-channel') {
      const key = interaction.options.getString('key', true);
      const channel = interaction.options.getChannel('channel', true);
      if (key === 'ticketCategoryId' && channel.type !== ChannelType.GuildCategory) {
        await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Ticket category must be a category channel.')] });
        return;
      }

      const next = await context.services.configManager.update(interaction.guildId, {
        [key]: channel.id
      });

      await interaction.reply({
        ephemeral: true,
        embeds: [successEmbed(`Updated ${key} to <#${channel.id}>.\n\n${formatConfig(next)}`, 'Config Updated')]
      });
      return;
    }

    if (subcommand === 'set-role') {
      const action = interaction.options.getString('action', true);
      const role = interaction.options.getRole('role', true);
      const staffRoleIds = new Set(config.staffRoleIds || []);
      if (action === 'add') {
        staffRoleIds.add(role.id);
      } else {
        staffRoleIds.delete(role.id);
      }

      const next = await context.services.configManager.update(interaction.guildId, {
        staffRoleIds: [...staffRoleIds]
      });

      await interaction.reply({
        ephemeral: true,
        embeds: [successEmbed(`Staff roles updated.\n\n${formatConfig(next)}`, 'Config Updated')]
      });
      return;
    }

    if (subcommand === 'set-text') {
      const key = interaction.options.getString('key', true);
      const value = interaction.options.getString('value', true);
      await context.services.configManager.update(interaction.guildId, {
        [key]: value
      });

      await interaction.reply({
        ephemeral: true,
        embeds: [successEmbed(`Updated ${key}.`, 'Config Updated')]
      });
      return;
    }

    if (subcommand === 'toggle') {
      const key = interaction.options.getString('key', true);
      const value = interaction.options.getBoolean('value', true);
      await context.services.configManager.update(interaction.guildId, {
        [key]: value,
        ...(key === 'activityTrackingEnabled' ? { levelingEnabled: value } : {})
      });

      await interaction.reply({
        ephemeral: true,
        embeds: [successEmbed(`Updated ${key} to ${value ? 'enabled' : 'disabled'}.`, 'Config Updated')]
      });
      return;
    }

    if (subcommand === 'ticket-type') {
      const type = interaction.options.getString('type', true);
      const action = interaction.options.getString('action', true);

      if (action === 'view') {
        const typeLabel = TICKET_TYPES.find((t) => t.value === type)?.name || type;
        const info = [
          `**${typeLabel}**`,
          `Roles: ${formatTicketTypeRoles(config, type)}`,
          `Category: ${formatTicketTypeCategory(config, type)}`
        ].join('\n');

        await interaction.reply({
          ephemeral: true,
          embeds: [baseEmbed({ title: 'Ticket Type Config', description: info })]
        });
        return;
      }

      if (action === 'add-role' || action === 'remove-role') {
        const role = interaction.options.getRole('role', true);
        const current = new Set(config.ticketTypeRoles?.[type] || []);

        if (action === 'add-role') {
          current.add(role.id);
        } else {
          current.delete(role.id);
        }

        const next = await context.services.configManager.update(interaction.guildId, {
          ticketTypeRoles: {
            ...config.ticketTypeRoles,
            [type]: [...current]
          }
        });

        await interaction.reply({
          ephemeral: true,
          embeds: [successEmbed(`Ticket type **${type}** roles updated.\n\n${formatConfig(next)}`, 'Config Updated')]
        });
        return;
      }

      if (action === 'set-category') {
        const category = interaction.options.getChannel('category', true);
        const next = await context.services.configManager.update(interaction.guildId, {
          ticketTypeCategoryIds: {
            ...config.ticketTypeCategoryIds,
            [type]: category.id
          }
        });

        await interaction.reply({
          ephemeral: true,
          embeds: [successEmbed(`Ticket type **${type}** category updated.\n\n${formatConfig(next)}`, 'Config Updated')]
        });
        return;
      }
    }
  }
};
