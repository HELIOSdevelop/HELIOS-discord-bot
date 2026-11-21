const env = require('../src/config/env');
const { deployCommands } = require('../src/services/command-deployment-service');

async function main() {
  await deployCommands({
    token: env.token,
    clientId: env.clientId,
    guildIds: env.guildIds,
    logger: console
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
