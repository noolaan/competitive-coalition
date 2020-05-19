const trueSkill = require('com.izaakschroeder.trueskill');
const ts = trueSkill.create();
const { stripIndents } = require('common-tags');

const ranks = require('../ranks.json');
const request = require('request-promise');

class Match {

    constructor(client, matchManager, opts = {}) {
        if(!opts) return null;
        
        Object.defineProperty(this, 'client', { value: client });

        this.players = opts.players;
        this.server = opts.server;
        this.matchManager = matchManager;
        this.guild = opts.guild;

        this.game = opts.game;
        this.type = opts.type;
        this.teamSize = opts.teamSize;
        this.currentMatches = opts.currentMatches;

        this.id = opts.id;

        this.voiceChannel = opts.voiceChannel;
        this.category = opts.category;

        this.organizer = opts.organizer;

    }

    async start() {

        const result = await this._createTeams();
        if(result.error) return result;
        
        this.teams = result.teams;

        // this.channels = await this._createChannels(this.teams);
        // await this._moveMembers(this.teams, this.channels);

        await this._teleportPlayers(this.teams);

        return { error: false, embed: this._matchEmbed() };

    }

    async end(winner) {

        let players = await this._grabStats(winner);
        players = await this._updateStats(players, winner);
        await this._updateRanks(players);

        for(const player of players) {
            if(player.member.voiceChannel) await player.member.setVoiceChannel(this.voiceChannel.id);
        }

        await this._deleteChannels();

    }

    async _teleportPlayers() {

        const users = [];
        const teams = {};

        for(const [ teamName, players ] of Object.entries(this.teams)) {
            for(const player of players) {
                console.log(teamName);
                const team = teamName === 'PHANTOMS' ? 0 : 1;
                console.log(team);
                users.push(player.robloxId);
                teams[player.robloxId] = team;
            }
        }

        const options = {
            uri: `secret-api`,
            method: 'POST',
            json: {
                server: this.server.server,
                users,
                teams
            },
            headers: {
                Authorization: "secret-auth"
            }
        };

        const response = await request(options);
        console.log(response); //eslint-disable-line

    }

    async _deleteChannels() {

        for(const channel of Object.values(this.channels)) {
            try {
                channel.delete();
            } catch(e) {
                return;
            }
        }

    }

    async _createTeams() {

        const players = this.players;
        // players.delete(this.organizer.id);

        let playerData = [];
        for(const player of players.values()) {
            const data = this.client.storageManager.tables['users'].users.get(player.id);
            if(data) {
                const stats = data.games[this.game];
                if(!stats) continue;
                const pData = {
                    trueSkill: trueSkill.create(stats.mu, stats.sigma),
                    member: player,
                    ...data
                };
                playerData.push(pData);
            }
        }

        if((this.teamSize*2) > playerData.length) {
            return { error: true, message: "Not all people in the voice-channel are verified." };
        }

        playerData = playerData.sort((a, b) => b.trueSkill.mu-a.trueSkill.mu);

        const teams = {
            PHANTOMS: [],
            GHOSTS: []
        };

        let phantomScore = 0;
        let ghostScore = 0;

        let placeholder = null;

        const addToTeam = (team, player) => {
            player.team = team;
            teams[team].push(player);
            if(team === 'PHANTOMS') {
                phantomScore += player.trueSkill.mu;
            } else {
                ghostScore += player.trueSkill.mu;
            }
            return player;
        };

        for(const player of playerData) {
            if(!placeholder) {
                placeholder = addToTeam('PHANTOMS', player);
                continue;
            } else {
                const pAvg = teams['PHANTOMS'].length === 0 ? 0 : phantomScore/teams['PHANTOMS'].length;
                const gAvg = teams['GHOSTS'].length === 0 ? 0 : ghostScore/teams['GHOSTS'].length;
                if(pAvg > gAvg && teams['GHOSTS'].length < this.teamSize) {
                    addToTeam('GHOSTS', player);
                    continue;
                } else if(gAvg > pAvg && teams['PHANTOMS'].length < this.teamSize) {
                    addToTeam('PHANTOMS', player);
                    continue;
                } else {
                    if(teams['PHANTOMS'].length < this.teamSize) {
                        addToTeam('PHANTOMS', player);
                        continue;
                    } else if(teams['GHOSTS'].length < this.teamSize){
                        addToTeam('GHOSTS', player);
                        continue;
                    } else {
                        break;
                    }
                }
            }
        }

        return { error: false, teams };


    }

    async _moveMembers(teams, channels) {
        for(const [ teamName, players ] of Object.entries(teams)) {
            const channel = channels[teamName];

            for(const player of players) {
                if(player.member.voiceChannel) await player.member.setVoiceChannel(channel);
            }
        }
    }

    async _createChannels(teams) {

        const matchNumber = this.currentMatches.size+1;

        let channels = {};
        for(const [ teamName, players] of Object.entries(teams)) {
            const overwrites = [ { id: this.guild.id, denied: ['CONNECT', 'VIEW_CHANNEL'] } ];
            for(const player of players) overwrites.push({ id: player.discordId, allowed: ['CONNECT', 'VIEW_CHANNEL'] });

            const channel = await this.guild.channels.create(`[M${matchNumber}] ${Constants.Prettify[teamName]}`, {
                type: 'voice',
                userLimit: this.teamSize,
                parent: this.category,
                overwrites
            });
            channels[teamName] = channel;
        }

        return channels;

    }

    async _grabStats(winner) {

        const win = winner === 'PHANTOMS' ? [0, 1] : [1, 0];

        const teams = [
            [],
            []
        ];

        for(const [ teamName, players ] of Object.entries(this.teams)) {
            const array = teamName === 'PHANTOMS' ? teams[0] : teams[1];
            for(const player of players) {
                const rating = player.trueSkill.createRating();
                array.push(rating);
            }
        }

        const newRatings = ts.update(teams, win);
        const players = [];

        for(let i = 0; i < teams.length; i++) {
            for(let j = 0; j < teams[i].length; j++) {
                const playerRating = newRatings[i][j];
                const teamName = i === 0 ? 'PHANTOMS' : 'GHOSTS';
                const player = this.teams[teamName][j];
                players.push({
                    rating: playerRating,
                    ...player
                });
            }
        }


        return players;

    }

    async _updateStats(players, winner) {

        const users = [];
        for(const player of players) {

            let user = await this.client.storageManager.tables['users'].get(player.discordId);
            const stats = user.games[this.game];

            user.games[this.game] = {
                ...stats,
                mu: player.rating.mu,
                sigma: player.rating.sigma
            };

            if(winner === player.team) user.games[this.game].wins++;
            else user.games[this.game].losses++;
            
            users.push({
                ...player,
                user
            });
            await this.client.storageManager.tables['users'].sync(player.discordId, user);

        }

        return users;

    }

    async _updateRanks(players) {

        const roles = Object.values(ranks).map(r=>r.role);

        for(const player of players) {

            const rank = this._fetchRank(player);
            const role = this.guild.roles.get(rank.role);
            if(!role) continue;
            if(player.member.roles.has(role)) continue;

            for(const r of roles) {
                if(r === role.id) continue;
                const removingRole = this.guild.roles.get(r);
                if(player.member.roles.has(r)) player.member.roles.remove(removingRole);
            }

            player.member.roles.add(role);

        }

    }

    _fetchRank(player) {

        const mu = Object.values(ranks).map(r=>r.value);
        const stats = player.games[this.game];

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

    get matchName() {
        return `${this.teamSize}v${this.teamSize}`;
    }

    _linkEmbed(player) {

        const data = {
            color: 0x79eab6,
            title: `<:match:449408497482989573>  ${this.matchName} Match`,
            description: stripIndents`Please join the match using this link: <${this.vipLink}>.
                **Do not share this link with anyone.**

                Once you're in a game, make sure to use the command \`/switch:${player.team.toLowerCase()}\`.
                Once everybody is in their respective teams, you may start playing.

                *Note: Failure to comply with match rules will result in a matchmaking ban.*`,
            fields: [],
            footer: {
                text: 'Competitive Coalition',
                icon_url: this.client.user.avatarURL()
            }
        };

        for(const obj of Object.entries(this.teams)) {
            const [ teamName, team ] = obj;

            data.fields.push({
                name: `${Constants.Prettify[teamName]} Team`,
                value: `${team.map(p=>`\`${p.robloxUsername}\``).join('\n')}`,
                inline: true
            });
        }
        
        return data;

    }

    _matchEmbed() {

        const data = {
            color: 0x79eab6,
            title: `<:match:449408497482989573>  ${this.matchName} Match [ID:${this.id}]`,
            fields: [],
            footer: {
                text: `Competitive Coalition`,
                icon_url: this.client.user.avatarURL()
            }
        };

        for(const obj of Object.entries(this.teams)) {
            const [ teamName, team ] = obj;

            data.fields.push({
                name: `${Constants.Prettify[teamName]} Team`,
                value: `${team.map(p=>`\`${p.robloxUsername}\``).join('\n')}`,
                inline: true
            });
        }
        
        return data;

    }

}

module.exports = Match;

const Constants = {
    TeamNames: ['PHANTOMS', 'GHOSTS'],
    Prettify: {
        PHANTOMS: 'Phantoms',
        GHOSTS: 'Ghosts'
    }
};