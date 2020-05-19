const Table = require('../interfaces/Table.js');
const defaultGuild = require('../defaultGuild.json');

class GuildsTable extends Table {

    constructor(client, options = {}) {

        super(client, {
            r: options.r,
            name: options.name,
            index: options.index
        });

        Object.defineProperty(this, 'client', { value: client });

        this.databaseManager = options.databaseManager;

        this.client.eventHooker.hook('guildCreate', this._createGuild);
        this.client.eventHooker.hook('guildDelete', this._deleteGuild);

    }

    async initialize() {
        for(const guild of this.client.guilds.values()) {
            if(!await this.exists(guild.id)) {
                await this._createGuild(guild);
            }
            guild.settings = await this.get(guild.id);
        }
        return this;
    }

    async sync(key, data) {
        const guild = this.client.guilds.get(key);
        if(!guild) return undefined;

        guild.settings = data;
        return await this.update(key, data);
    }

    _createGuild(guild) {
        const info = { ...defaultGuild, id: guild.id };
        guild.settings = info;

        this.storageManager.log(`Created guild: ${guild.name} (${guild.id})`, { error: false });
        return this.set(guild.id, info);
    }

    _deleteGuild(guild) {
        this.storageManager.log(`Removed guild: ${guild.name} (${guild.id})`, { error: false });
        return this.remove(guild.id);
    }

}

module.exports = GuildsTable;