const Command = require('../../interfaces/Command.js');

class PingCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'ping',
            description: "Determines the response time of the bot.",
            split: 'QUOTED',
            flags: [
                {
                    id: 'memes',
                    type: 'integer',
                    required: true,
                    arguments: true
                }
            ],
            restricted: true
        });

    }

    async execute(message) {
        message.respond("memes", { emoji: 'success' });
    }

}

module.exports = PingCommand;