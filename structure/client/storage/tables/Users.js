const Table = require('../interfaces/Table.js');

class UsersTable extends Table {

    constructor(client, options = {}) {

        super(client, {
            r: options.r,
            name: options.name,
            index: options.index
        });

        Object.defineProperty(this, 'client', { value: client });

        this.databaseManager = options.databaseManager;
        this.verifiedRole = this.client._settings.verifiedRole;

        this.users = new Map();

    }

    async initialize() {
        for(const user of this.client.users.values()) {
            const u = await this.get(user.id);
            if(u) this.users.set(user.id, u);
        }
        return this;
    }

    async sync(key, data) {
        this.users.set(key, data);

        return await this.update(key, data);
    }

    async _addUser(message, info) {
        const data = {
            robloxUsername: info.robloxUsername,
            robloxId: info.robloxId,
            discordId: message.author.id,
            games: {}
        };

        await this.set(message.author.id, data);
        this.users.set(message.author.id, data);

        try {
            message.member.roles.add(this.verifiedRole, "Verified user");
        } catch(e) {
            console.log(e); //eslint-disable-line
        }
    }

    async _grabRobloxUsername(username) {
        const res = await this._index.filter(this.r.row("robloxUsername").eq(username));
        if(res.length > 0) return res[0];
        else return null;
    }


}

module.exports = UsersTable;