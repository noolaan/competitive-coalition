const Module = require('../interfaces/Module.js');

class UtilityModule extends Module {

    constructor(client) {

        super(client, {
            name: 'utility',
            commandsIndex: 'utility'
        });

        Object.defineProperty(this, 'client', { value: client });

    }

}

module.exports = UtilityModule;