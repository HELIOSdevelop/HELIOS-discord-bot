const { BaseRepository } = require('./base-repository');

class ActivityRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'activity');
  }
}

module.exports = { ActivityRepository };
