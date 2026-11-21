const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, rolePanelComponents, successEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-panel')
    .setDescription('Create a self-assign role panel.')
    .addStringOption((option) =>
      option.setName('title').setDescription('Panel title').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('description').setDescription('Panel description').setRequired(true)
    )
    .addRoleOption((option) => option.setName('role1').setDescription('First role').setRequired(true))
    .addRoleOption((option) => option.setName('role2').setDescription('Second role'))
    .addRoleOption((option) => option.setName('role3').setDescription('Third role'))
    .addRoleOption((option) => option.setName('role4').setDescription('Fourth role'))
    .addRoleOption((option) => option.setName('role5').setDescription('Fifth role')),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    if (!(await requireStaff(interaction, config))) {
      return;
    }

    const roles = ['role1', 'role2', 'role3', 'role4', 'role5']
      .map((name) => interaction.options.getRole(name))
      .filter(Boolean);

    if (!roles.length) {
      await interaction.reply({ ephemeral: true, embeds: [errorEmbed('At least one role is required.')] });
      return;
    }

    await interaction.channel.send({
      embeds: [
        baseEmbed({
          title: interaction.options.getString('title'),
          description: interaction.options.getString('description')
        })
      ],
      components: rolePanelComponents(roles)
    });

    await interaction.reply({
      ephemeral: true,
      embeds: [successEmbed('Role panel posted successfully.', 'Panel Created')]
    });
  }
};
