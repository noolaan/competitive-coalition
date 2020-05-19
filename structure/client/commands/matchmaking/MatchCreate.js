const Command = require('../../interfaces/Command.js');

class MatchCreateCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'match-create',
            description: "Starts a match.",
            aliases: [
                'creatematch',
                'create-match',
                'matchcreate'
            ],
            split: 'PLAIN',
            restricted: true
        });

        this.matchManager = this.client.matchManager;

    }

    async execute(message, { args }) {
        
        const voiceChannel = message.member.voiceChannel;
        if(!voiceChannel) {
            return message.respond(`You must be in a queue voice-channel to start a match.`, { emoji: 'failure' });
        }
        
        const vcInfo = Constants.VoiceChannels[voiceChannel.id];
        if(!vcInfo) return message.respond(`That's not a valid queue voice-channel.`, { emoji: 'failure' });

        const teamSize = parseInt(args[0]);

        if(Number.isNaN(teamSize) | !Constants.MatchTypes.includes(teamSize)) {
            return message.respond(`Invalid match type found, available: ${Constants.MatchTypes.map(m=>`\`${m}v${m}\``).join(', ')}.`, { emoji: 'failure' });
        }
    
        await message.guild.members.fetch();    

        const matchCreate = await this.matchManager.createMatch({
            ...vcInfo,
            guild: message.guild,
            organizer: message.author,
            queue: voiceChannel,
            teamSize
        });

        if(matchCreate.error) {
            return message.respond(matchCreate.message, { emoji: 'failure' });
        }

        // const response = await matchCreate.match.start();
        // if(response.error) {
        //     return message.respond(response.message, { emoji: 'failure' });
        // }

        // const embed = response.embed;
        // message.channel.send(``, {
        //     embed
        // });

    }

}

module.exports = MatchCreateCommand;

const Constants = {
    VoiceChannels: {
        "448346939382300673": {
            type: 'REGULAR',
            game: 'PHANTOM_FORCES'
        },
        "448348002109882368": {
            type: 'PROFESSIONAL',
            game: 'PHANTOM_FORCES'
        },
        "448349914192281600": {
            type: 'REGULAR',
            game: 'CALL_OF_ROBLOXIA'
        },        
        "448350028096864267": {
            type: 'PROFESSIONAL',
            game: 'CALL_OF_ROBLOXIA'
        }
    },
    Categories: {
        PHANTOM_FORCES: "448342390856482826",
        CALL_OF_ROBLOXIA: "448342428856877067"
    },
    MatchTypes: [1, 2, 4, 5, 6, 7, 8]
};