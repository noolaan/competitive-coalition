const Command = require('../../interfaces/Command.js');

const emojis = require('../../../../util/emojis.json');
const { stripIndents } = require('common-tags');

class MatchRemoveCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'match-end',
            description: "Ends a match.",
            aliases: [
                'end-match',
                'endmatch',
                'matchend'
            ],
            split: 'PLAIN'
        });

        this.matchManager = this.client.matchManager;

    }

    async execute(message, { args }) {
        
        const match = this.matchManager.matches.get(parseInt(args));
        if(!match) return message.respond(`Unable to find a match with that ID.`, { emoji: 'failure' });

        const embed = match._matchEmbed();
        await message.channel.send(stripIndents`${emojis.loading} Which team won the match? (__p__hantoms | __g__hosts)
            This prompt __will timeout after 30 seconds__.`, { embed });

        const response = await this._getResponse(message, message.channel);
        const content = response.content.toLowerCase();
        
        if(['p', 'phantoms'].includes(content)) {
            await this.matchManager.removeMatch(match.id, 'PHANTOMS');
        } else if(['g', 'ghosts'].includes(content)) {
            await this.matchManager.removeMatch(match.id, 'GHOSTS');
        } else {
            return message.respond(`Unable to find a team name from response, aborted.`, { emoji: 'failure' });
        }

        return message.respond(`Match successfully ended.`, { emoji: 'success' });

    }

    async _getResponse(message, channel, seconds = 30) {

        let collected;

        try {
            collected = await channel.awaitMessages(m => m.author.id === message.author.id, {
                max: 1,
                time: seconds*1000,
                errors: ['time']
            });
        } catch(e) {
            channel.send(`${this.emojis.failure} Prompt timed out, try again.`);
            return null;
        }

        if(!collected) {
            channel.send(`${this.emojis.failure} An error occured, try again.`);
            return null;
        }
        return collected.first();

    }

}

module.exports = MatchRemoveCommand;