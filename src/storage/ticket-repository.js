const { BaseRepository } = require('./base-repository');

class TicketRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'tickets');
  }
}

module.exports = { TicketRepository };
