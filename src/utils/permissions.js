const { PermissionFlagsBits } = require('discord.js');

function isStaff(member, config) {
  if (!member) {
    return false;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  return (config.staffRoleIds || []).some((roleId) => member.roles.cache.has(roleId));
}

async function requireStaff(interaction, config) {
  if (isStaff(interaction.member, config)) {
    return true;
  }

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      ephemeral: true,
      content: 'You need a configured staff role or Administrator permission to use this.'
    });
  }

  return false;
}

module.exports = { isStaff, requireStaff };
