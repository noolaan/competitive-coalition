const Command = require('../../interfaces/Command.js');

const { stripIndents } = require('common-tags'); 

class VerifyCreateCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'verify-remove',
            description: "Verify your ROBLOX account to your Discord account.",
            guildOnly: true,
            restricted: true,
            aliases: [
                'verify-delete',
                'unverify'
            ],
            throttling: {
                usages: 1,
                duration: 15
            }
        });

        this.userTable = this.client.storageManager.tables['users'];
        this.emojis = this.client._emojis;

    }

    async execute(message) {

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

module.exports = VerifyCreateCommand;