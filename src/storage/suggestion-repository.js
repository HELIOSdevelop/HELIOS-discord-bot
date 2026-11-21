const { BaseRepository } = require('./base-repository');

class SuggestionRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'suggestions');
  }
}

module.exports = { SuggestionRepository };
