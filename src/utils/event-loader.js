const fs = require('fs');
const path = require('path');

function loadEventFiles(eventsDir) {
  const output = [];
  const entries = fs.readdirSync(eventsDir, { withFileTypes: true });

  for (const entry of entries) {
    const target = path.join(eventsDir, entry.name);
    if (entry.isDirectory()) {
      output.push(...loadEventFiles(target));
      continue;
    }

    if (target.endsWith('.js')) {
      output.push(target);
    }
  }

  return output;
}

function registerEvents(client, eventsDir, context) {
  const files = loadEventFiles(eventsDir);

  for (const file of files) {
    const event = require(file);
    const handler = (...args) => event.execute(...args, context);
    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }
}

module.exports = { registerEvents };
