const Module = require('../interfaces/Module.js');

class MatchmakingModule extends Module {

    constructor(client) {

        super(client, {
            name: 'matchmaking',
            commandsIndex: 'matchmaking'
        });

        Object.defineProperty(this, 'client', { value: client });

    }

}

module.exports = MatchmakingModule;