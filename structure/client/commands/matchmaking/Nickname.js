const Command = require('../../interfaces/Command.js');

class NicknameCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'nickname',
            description: "Sets your nickname for you.",
            aliases: [
                'nick'
            ],
            split: 'NONE'
        });

    }

    async execute(message, { args }) {
        
        const user = this.client.storageManager.tables['users'].users.get(message.author.id);
        if(!user) return message.respond(`You're not verified!` , { emoji: 'failure' });

        // const string = `${args} ${args === }`

    }

}

module.exports = NicknameCommand;