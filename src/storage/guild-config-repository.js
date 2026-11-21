const { BaseRepository } = require('./base-repository');

class GuildConfigRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'guild-configs');
  }
}

module.exports = { GuildConfigRepository };
