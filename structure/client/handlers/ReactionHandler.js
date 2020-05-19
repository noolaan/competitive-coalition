const ranks = require('../../matchmaking/ranks.json');

class ReactionHandler {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.guild = this.client._settings.guildId;
        this.throttles = new Map();

    }

    async handleAdd(reaction, user) { 
        const guild = reaction.message.guild;
        if(guild.id !== this.guild) return undefined;
        const id = Constants.Emojis[reaction.emoji.id];
        if(!id) return undefined;

        const throttle = this._throttle(user);
        if(throttle) {
            throttle.usages++;
            if(throttle.usages > 3) {
                return undefined;
            }
        }

        const roles = Constants.Roles[id].slice(0);
        const member = await guild.members.fetch(user.id);
        let userData = await this.client.storageManager.tables['users'].users.get(user.id);
        if(userData) {
            if(!userData.games[id]) {
                const data = { mu: 25, sigma: 25/3, wins: 0, losses: 0, kills: 0, deaths: 0 };
                userData.games[id] = data;
                await this.client.storageManager.tables['users'].sync(user.id, userData);
            } else {
                const { role } = this._fetchRank(userData.games[id]);
                roles.push(role);
            }
        }

        try {
            await member.roles.add(roles);
        } catch(e) {
            return undefined;
        }
    }

    async handleRemove(reaction, user) {
        const guild = reaction.message.guild;
        if(guild.id !== this.guild) return undefined;
        const id = Constants.Emojis[reaction.emoji.id];
        if(!id) return undefined;

        const throttle = this._throttle(user);
        if(throttle) {
            throttle.usages++;
            if(throttle.usages > 3) {
                return undefined;
            }
        }

        const roles = Constants.Roles[id].slice(0);
        const member = await guild.members.fetch(user.id);

        for(const role of member.roles.values()) {
            const rankRoles = Object.values(ranks).map(r=>r.role);
            if(rankRoles.includes(role.id)) roles.push(role.id);
        }

        try {
            await member.roles.remove(roles);
        } catch(e) {
            return undefined;
        }

    }

    _fetchRank(stats) {

        const mu = Object.values(ranks).map(r=>r.value);

        let amt = null;
        for(const value of mu) {
            if(stats.mu >= value) amt = value;
        }

        let r;
        for(const [ name, data ] of Object.entries(ranks)) {
            if(data.value === amt) r = { ...data, name };
        }

        return r;

    }

    _throttle(user) {
    
        let throttle = this.throttles.get(user.id);
        if(!throttle) {
            throttle = {
                start: Date.now(),
                usages: 0,
                timeout: this.client.setTimeout(() => {
                    this.throttles.delete(user.id);
                }, 10000)
            };
            this.throttles.set(user.id, throttle);
        }
        return throttle;
    }

}

module.exports = ReactionHandler;

const Constants = {
    Emojis: {
        "448704161148829696": 'PHANTOM_FORCES'
    },
    Roles: {
        PHANTOM_FORCES: [
            '448347585044807681'
        ]
    }
};