const { BaseRepository } = require('./base-repository');

class RuntimeStateRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'runtime-state');
  }
}

module.exports = { RuntimeStateRepository };
