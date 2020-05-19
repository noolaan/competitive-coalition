const { Inhibitor } = require('../interfaces/');

class RestrictedInhibitor extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'restricted',
            guarded: true,
            priority: 10
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async run(message, command) {

        if(command.restricted && message.author.id !== this.client._settings.owner) return super.fail(this, `The module **${command.resolveable}** can only be run by developers.`);
        else return super.succeed(this);

    }

}

module.exports = RestrictedInhibitor;
