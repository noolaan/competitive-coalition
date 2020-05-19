class Table {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        this.storageManager = this.client.storageManager;

        this.r = opts.r;
        this.name = opts.name;
        this.index = opts.index;

    }

    async keys() {
        try {
            return await this._index.getField('id').run() || [];
        } catch(error) {
            this._error(error);
        }
    }

    async get(key) {
        try {
            return await this._index.get(key).run() || null;
        } catch(error) {
            this._error(error);
        }
    }

    async exists(key) {
        return Boolean(await this.get(key));
    }

    async set(key, data) {
        data.id = key;
        try {
            return await this._index.insert(data).run() || null;
        } catch(error) {
            this._error(error);
        }
    }

    async remove(key) {
        try {
            const available = await this.get(key);
            return await available ? this._index.get(key).delete().run() : null;
        } catch(error) {
            this._error(error);
        }
    }

    async update(key, data) {
        try {
            const available = await this.get(key);
            return await available ? this._index.get(key).update(data) : null;
        } catch(error) {
            this._error(error);
        }
    }

    async clear() {
        try {
            return await this._index.delete().run();
        } catch(error) {
            this._error(error);
        }
    }

    _error(error) {
        this.storageManager.log(`Database (${this.name}:${this.index}) Error:\n${error.stack || error}`, { error: true });
    }

    get _index() {
        return this.r.db(this.name).table(this.index);
    }

}

module.exports = Table;