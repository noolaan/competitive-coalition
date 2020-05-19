const Collection = require('../../util/Collection.js');

const Match = require('./interfaces/Match.js');
const request = require('request-promise');
const { stripIndents } = require('common-tags');

class MatchManager {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.matches = new Collection();

    }

    async createMatch(info = {}) {
        const { game, type} = info;

        const currentMatches = this.matches.filter(m=>m.game === game);
        if(currentMatches.size === Constants.MaxMatches) {
            return { error: true, message: `Unable to start match, \`${Constants.MaxMatches}\` is the max amount of matches per game.` };
        }

        const serverId = new Date().getTime().toString(36);
        const options = {
            uri: `secret-api`,
            method: 'GET',
            headers: {
                Authorization: "secret-auth"
            }
        };

        let players = info.voiceChannel.members.clone();
        for(const match of this.matches.values()) {
            const teams = match.teams;
            for(const [ teamName, plyrs ] of Object.entries(teams)) { //eslint-disable-line
                for(const player of plyrs) {
                    if(players.has(player.member.id)) {
                        players.delete(player.member.id);
                    }
                }
            }
        }

        const notIngame = [];

        for(const [ id, player ] of players) {

            const userData = this.client.storageManager.tables['users'].users.get(id);
            if(!userData) return {
                error: true,
                message: `User \`${player.user.tag}\` is not verified.`
            };

            const response = await request({
                uri: `secret-api`,
                method: 'GET',
                headers: {
                    Authorization: "secret-auth"
                }
            });

            const data = JSON.parse(response);
            if(!data.ingame) notIngame.push(player);

        } 

        if(notIngame.length > 0) {
            return {
                error: true,
                message: stripIndents`Not all members are in a Phantom Forces server, remaining members: ${notIngame.map(p=>`\`${p.user.tag}\``).join(', ')}.
                    Join a server using this link: <https://www.roblox.com/games/292439477/Phantom-Forces>.`
            };
        }

        const response = await request(options);
        const server = JSON.parse(response);
        if(!server.success) {
            return { 
                error: true,
                message: `Server failed to start, try again.`
            };
        }

        const id = this.matches.size+1;
        const match = new Match(this.client, this, {
            players,
            server,
            game,
            id,
            type,
            currentMatches,
            ...info
        });

        this.matches.set(id, match);
        return { error: false, match };

    }

    async removeMatch(id, winner) {

        const match = this.matches.get(id);
        await match.end(winner);

        this.matches.delete(id);

    }

}

module.exports = MatchManager;

const Constants = {
    MaxMatches: 1000000
};

/* 

// Teleport Example //

const options2 = {
    uri: `secret-api`,
    method: 'POST',
    json: {
        users: [ 195329 ],
        server: server.server,
        teams: {
            "195329": 0
        }
    },
    headers: {
        Authorization: "secret-auth"
    }
};

NOTE: 0 = phantoms | 1 = ghosts

// CreateServer Example //

const options = {
    uri: `secret-api`,
    method: 'GET',
    headers: {
        Authorization: "secret-auth"
    }
};

*/