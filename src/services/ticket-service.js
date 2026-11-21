const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, ticketCloseComponents } = require('../utils/builders');

const TICKET_TYPES = {
  support: { channelPrefix: 'support', welcomeTitle: 'Support Ticket', welcomeDescription: 'A staff member will be with you as soon as possible.' },
  report: { channelPrefix: 'report', welcomeTitle: 'Report Ticket', welcomeDescription: 'Your report will be handled as soon as possible.' },
  donation: { channelPrefix: 'donation', welcomeTitle: 'Donation Ticket', welcomeDescription: 'Thank you for your donation! We will contact you.' },
  question: { channelPrefix: 'question', welcomeTitle: 'General Question', welcomeDescription: 'Your question will be answered as soon as possible.' }
};

const TICKET_TYPE_KEYS = Object.keys(TICKET_TYPES);

class TicketService {
  constructor(repository) {
    this.repository = repository;
  }

  createId() {
    return `ticket_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  getStaffRoleIdsForType(config, type) {
    const typeRoles = config.ticketTypeRoles?.[type];
    if (typeRoles && typeRoles.length > 0) {
      return typeRoles;
    }
    return config.staffRoleIds || [];
  }

  getCategoryIdForType(config, type) {
    const typeCategory = config.ticketTypeCategoryIds?.[type];
    if (typeCategory) {
      return typeCategory;
    }
    return config.ticketCategoryId;
  }

  async createTicket(interaction, config, type, modalData) {
    const existing = await this.repository.get(`${interaction.guildId}:${interaction.user.id}`);
    if (existing?.channelId) {
      return { existing };
    }

    const typeInfo = TICKET_TYPES[type] || TICKET_TYPES.support;
    const staffRoleIds = this.getStaffRoleIdsForType(config, type);

    const overwrites = [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }
    ];

    for (const roleId of staffRoleIds) {
      overwrites.push({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]
      });
    }

    const ticketId = this.createId();
    const channel = await interaction.guild.channels.create({
      name: `${typeInfo.channelPrefix}-${interaction.user.username}`.toLowerCase().slice(0, 90),
      type: ChannelType.GuildText,
      parent: this.getCategoryIdForType(config, type) || undefined,
      permissionOverwrites: overwrites,
      topic: `${typeInfo.welcomeTitle} for ${interaction.user.tag} (${ticketId})`
    });

    const record = {
      id: ticketId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      channelId: channel.id,
      type,
      status: 'open',
      modalData: modalData || {},
      createdAt: new Date().toISOString()
    };

    await this.repository.set(`${interaction.guildId}:${interaction.user.id}`, record);
    await this.repository.set(ticketId, record);

    const fields = modalData ? Object.entries(modalData).map(([key, value]) => ({
      name: key,
      value,
      inline: false
    })) : [];

    const embeds = [
      baseEmbed({
        title: typeInfo.welcomeTitle,
        description: typeInfo.welcomeDescription
      }).addFields(fields.length > 0 ? fields : [])
    ];

    if (type === 'donation') {
      embeds.push(
        baseEmbed({
          title: 'Important Information',
          description: 'You are donating money to the server, and as a thank you we give you a vehicle or something else of your choice. You are not buying this vehicle or any other product — you are donating, and we give you something in return. Therefore, you will not receive a refund for any reason. If you come with a reason such as "my little brother accidentally bought this," the ticket will be closed.'
        })
      );
    }

    await channel.send({
      content: `${interaction.user} ${staffRoleIds.map((id) => `<@&${id}>`).join(' ')}`.trim(),
      embeds,
      components: ticketCloseComponents(ticketId)
    });

    return { ticket: record, channel };
  }

  async closeTicket(ticketId) {
    const record = await this.repository.get(ticketId);
    if (!record) {
      return null;
    }

    const next = {
      ...record,
      status: 'closed',
      closedAt: new Date().toISOString()
    };

    await this.repository.set(ticketId, next);
    await this.repository.delete(`${record.guildId}:${record.userId}`);
    return next;
  }
}

module.exports = { TicketService, TICKET_TYPES, TICKET_TYPE_KEYS };
