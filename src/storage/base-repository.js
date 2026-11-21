class BaseRepository {
  constructor(adapter, collectionName) {
    this.adapter = adapter;
    this.collectionName = collectionName;
  }

  async all() {
    return this.adapter.read(this.collectionName, {});
  }

  async get(key, fallback = null) {
    const collection = await this.all();
    return collection[key] ?? fallback;
  }

  async set(key, value) {
    const collection = await this.all();
    collection[key] = value;
    await this.adapter.write(this.collectionName, collection);
    return value;
  }

  async delete(key) {
    const collection = await this.all();
    delete collection[key];
    await this.adapter.write(this.collectionName, collection);
  }
}

module.exports = { BaseRepository };
