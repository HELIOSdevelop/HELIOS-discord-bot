const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(target);
    }

    return target.endsWith('.js') ? [target] : [];
  });
}

function loadCommands(commandsDir) {
  const files = walk(commandsDir);
  const commands = new Map();

  for (const file of files) {
    const command = require(file);
    commands.set(command.data.name, command);
  }

  return commands;
}

module.exports = { loadCommands };
