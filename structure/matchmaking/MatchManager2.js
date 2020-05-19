const request = require('request-promise');
const { stripIndents } = require('common-tags');
const Collection = require('../../util/Collection.js');
const Match = require('./interfaces/Match2.js');

class MatchManager {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.matches = new Collection();
        this.storageManager = this.client.storageManager;

    }

    async createMatch(opts = {}) {
        if(!opts) return undefined;

        const members = opts.queue.members.clone();
        const users = [];

        const unverified = [];
        for(const member of members.values()) {
            const data = this.client.storageManager.tables['users'].users.get(member.id);
            if(!data || !data.games[opts.game]) unverified.push(member);
            else users.push({
                member,
                ...data
            });
        }

        const inMatch = [];
        for(const match of this.matches.values()) {
            for(const player of match.players) {
                if(members.has(player.member.id)) {
                    inMatch.push(player.member);
                    members.delete(player.member.id);
                }
            }
        }

        const required = opts.teamSize*2;
        if(required > users.length) {
            return {
                error: true,
                message: `Not enough users to start a match.`
            };
        }

        const notIngame = [];
        for(const user of users) {

            const response = await request({
                uri: `secret-api`,
                method: 'GET',
                headers: {
                    Authorization: 'secret-auth'
                }
            });

            const data = JSON.parse(response);
            if(!data.success || !data.ingame) notIngame.push(user);

        }

        if(notIngame.length > 0) {
            return {
                error: true,
                message: stripIndents`Not all members are in a Phantom Forces server, remaining members: ${notIngame.map(p=>`\`${p.member.user.tag}\``).join(', ')}.
                    Join a server using this link: <https://www.roblox.com/games/292439477/Phantom-Forces>.`
            };
        }

        const id = this.matches.size+1;
        const match = new Match(this.client, {
            ...opts,
            users,
            id
        });

        const response = await match.start();
        if(response.error) {
            return {
                error: true,
                message: response.message
            };
        }

        this.matches.set(id, match);
        return { error: false, match };

    }

    async destroyMatch(id, results = {}) {

        /*
        for(const player of results.stats) {
            const [ playerId, kills, deaths, score ] = player;
        }
        */

        const match = this.matches.get(id);
        const result = await match.end(results);
        

        this.matches.delete(id);

    }

}


module.exports = MatchManager;