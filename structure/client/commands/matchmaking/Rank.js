const Command = require('../../interfaces/Command.js');

const ranks = require('../../../matchmaking/ranks.json');

class StatisticsCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'statistics',
            description: "Grabs player info.",
            split: 'NONE',
            flags: [
                {
                    id: 'game',
                    type: 'string',
                    default: 'pf',
                    arguments: true
                }
            ],
            aliases: [
                'stats'
            ],
        });

    }

    async execute(message, { args, flags }) {
        
        let member = this.client.resolver.member(args, message.guild);
        if(!member) member = message.member;

        const user = this.client.storageManager.tables['users'].users.get(member.user.id);
        if(!user) return message.respond(`That user isn't verified with the server.`, { emoji: 'failure' });

        const game = this._fetchGame(flags);
        if(!game) return message.respond(`Unable to find specified game.`, { emoji: 'failure' });
        const stats = user.games[game];
        if(!stats) return message.respond(`That user doesn't play that game!`);

        const embed = await this._userEmbed(member, user, stats);
        await message.respond({ embed });

    }

    async _userEmbed(member, data, stats) {

        const rank = this._fetchRank(stats);
        const color = Constants.HexColors[rank];

        return {
            color: color,
            author: {
                name: `${member.user.tag} (${data.robloxUsername})`,
                icon_url: member.user.avatarURL()
            },
            fields: [
                {
                    name: 'Rank',
                    value: rank,
                    inline: true
                },
                {
                    name: 'MU',
                    value: stats.mu.toFixed(2),
                    inline: true
                },
                {
                    name: 'Sigma',
                    value: stats.sigma.toFixed(2),
                    inline: true
                },
                {
                    name: 'Wins',
                    value: stats.wins,
                    inline: true
                }, 
                {
                    name: 'Losses',
                    value: stats.losses,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                }
            ],
            footer: {
                text: 'Competitive Coalition',
                icon_url: this.client.user.avatarURL()
            }
        };

    }

    _fetchGame(flags) {
        const string = flags['game'] ? flags['game'].query : 'pf';
        if(Constants.Games.PHANTOM_FORCES.includes(string)) return 'PHANTOM_FORCES';
        if(Constants.Games.CALL_OF_ROBLOXIA.includes(string)) return 'CALL_OF_ROBLOXIA';
        else return null;
    }

    _fetchRank(stats) {

        const mu = Object.values(ranks).map(r=>r.value);
        let amount = null;

        for(const value of mu) {
            if(stats.mu >= value) amount = value;
        }

        let r = null;
        for(const [ rank, data ] of Object.entries(ranks)) {
            if(data.value === amount) r = rank;
        }

        return r;

    }


}

module.exports = StatisticsCommand;

const Constants = {
    Games: {
        PHANTOM_FORCES: ['pf', 'phantom', 'phantomforces'],
        CALL_OF_ROBLOXIA: ['cor', 'call', 'callofrobloxia']
    },
    HexColors: {
        'Copper': 0x91695f,
        'Bronze': 0xd6b381,
        'Silver': 0x000000,
        'Gold': 0xe3d768,
        'Platinum': 0xb7dbe9,
        'Diamond': 0x6ca3e3,
        'Champion': 0xb086dc,
        'Grand Champion': 0x9f5ce6
    }
};