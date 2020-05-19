const trueSkill = require('com.izaakschroeder.trueskill');
const ts = trueSkill.create(); //eslint-disable-line

const Server = require('./Server.js');

class Match extends Server {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client);
        
        Object.defineProperty(this, 'client', { value: client });

        this.matchManager = this.client.matchManager;

        this.id = opts.id;

        this.users = opts.users;
        this.guild = opts.guild;
        this.teamSize = opts.teamSize;

        this.queue = opts.queue;
        this.game = opts.game;
        this.type = opts.type;

        this.organizer = opts.organizer;

        this.channels = null;

    }

    /*

            MATCH INITIALIZATION

                                        */

    async start() {

        const response = await this._createServer();
        if(response.error) {
            return {
                error: true,
                message: 'Failed to create a server.'
            };
        }

        await this._createTeams();
        this.channels = await this._createChannels();
        await this._moveMembers();

        await this._teleportMembers();
        
        return { error: false };

    }

    async _createTeams() {
        
        const users = this.users;

        for(const user of users) {
            const stats = user.games[this.game];
            user.trueSkill = trueSkill.create(stats.mu, stats.sigma);
        }

        const sorted = users.sort((a, b) => b.trueSkill.mu-a.trueSkill.mu);

        let placeholder = null,
            phantomScore = 0,
            ghostScore = 0;

        for(const user of sorted) {
            const stats = user.games[this.game];
            user.trueSkill = trueSkill.create(stats.mu, stats.sigma);

            if(!placeholder) {
                user.team = 'PHANTOMS';
                phantomScore += stats.mu;
                placeholder = user;
            } else {
                const pTeam = users.filter(u=>u.team === 'PHANTOMS');
                const gTeam = users.filter(u=>u.team === 'GHOSTS');
                const pAvg = pTeam.length === 0 ? 0 : phantomScore/pTeam.length;
                const gAvg = gTeam.length === 0 ? 0 : ghostScore/gTeam.length;
            
                if(pAvg > gAvg && gTeam.length < this.teamSize) {
                    user.team = 'GHOSTS';
                    ghostScore += stats.mu;
                } else if(gAvg > pAvg && pTeam.length < this.teamSize) {
                    user.team = 'PHANTOMS';
                    phantomScore += stats.mu;
                } else {
                    if(pTeam.length < this.teamSize) {
                        user.team = 'PHANTOMS';
                        phantomScore += stats.mu;        
                    } else {
                        user.team = 'GHOSTS';
                        ghostScore += stats.mu;
                    }
                }

                continue;

            }

        }

        return users;

    }

    async _createChannels() {

        let channels = {};
        
        const teams = this.teams;
        for(const [ teamName, players ] of Object.entries(teams)) {
            const overwrites = [ { id: this.guild.id, denied: [ 'CONNECT', 'VIEW_CHANNEL' ] } ];
            for(const player of players) overwrites.push({ id: player.discordId, allowed: [ 'CONNECT', 'VIEW_CHANNEL' ] });

            const channel = await this.guild.channels.create(`[M${this.id}-${this.type.substr(0, 3)}] ${Constants.Prettify[teamName]}`, {
                type: 'voice',
                userLimit: this.teamSize,
                parent: Constants.Categories[this.game],
                overwrites
            });
            
            channels[teamName] = channel;

        }

        return channels;

    }

    async _moveMembers() {

        const teams = this.teams;
        for(const [ teamName, players] of Object.entries(teams)) {
            const channel = this.channels[teamName];

            for(const player of players) {
                if(player.member.voiceChannel) await player.member.setVoiceChannel(channel.id);
            }
        }
        
    }

    async _teleportMembers() {

        const users = [];
        const teams = {};

        for(const user of this.users) {
            const team = user.team === 'PHANTOMS' ? 0 : 1;
            users.push(user.robloxId);
            teams[user.robloxId] = team;
        }

        await super._teleportUsers(users, teams);

    }

    /*

               MATCH FINISHED

                                        */


    async end(results = {}) { //eslint-disable-line
        
    }


    /*

                MISCELLANEOUS

                                        */

    get teams() {

        const teams = {
            PHANTOMS: [],
            GHOSTS: []
        };

        for(const user of this.users) {
            if(user.team === 'PHANTOMS') teams['PHANTOMS'].push(user);
            else teams['GHOSTS'].push(user);
        }
        
        return teams;

    }

}

module.exports = Match;

const Constants = {
    Prettify: {
        PHANTOMS: 'Phantoms',
        GHOSTS: 'Ghosts'
    },
    Categories: {
        PHANTOM_FORCES: "448342390856482826",
        CALL_OF_ROBLOXIA: "448342428856877067"
    }
};